"""Check the site at its GitHub Pages project path, including real browser interactions."""
from pathlib import Path
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from html.parser import HTMLParser
from urllib.parse import urlparse, unquote
import json, tempfile, threading, traceback
import fitz
from PIL import Image
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
QA=ROOT/"qa"
QA.mkdir(exist_ok=True)
report={"checks":[],"failures":[]}
def record(name):
    report["checks"].append(name)
    print("PASS",name)
class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links=[];self.ids=set()
    def handle_starttag(self,tag,attrs):
        attrs=dict(attrs)
        if "id" in attrs: self.ids.add(attrs["id"])
        if "href" in attrs: self.links.append(attrs["href"])
        if tag in ("img","script") and attrs.get("src"): self.links.append(attrs["src"])
class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self,*args): pass

try:
    pages=[ROOT/"progress-you-can-prove/index.html"]+sorted((ROOT/"progress-you-can-prove").glob("*/index.html"))
    assert len(pages)==6
    parsed={}
    for page in pages:
        parser=Links();parser.feed(page.read_text());parsed[page]=parser
        assert "PREFIX" not in page.read_text()
        assert "\u2014" not in page.read_text()
    for page,parser in parsed.items():
        for link in parser.links:
            url=urlparse(link)
            if url.scheme or url.netloc: continue
            target=(page.parent/unquote(url.path)).resolve() if url.path else page
            if target.is_dir(): target=target/"index.html"
            assert target.exists(),str(page.relative_to(ROOT))+" missing "+link
            assert target.is_relative_to(ROOT),"Path leaves repository: "+link
            if url.fragment and target.suffix==".html":
                if target not in parsed:
                    item=Links();item.feed(target.read_text());parsed[target]=item
                assert url.fragment in parsed[target].ids,"Missing anchor "+link
    record("All six pages: relative links, asset paths and fragment targets")

    specs=json.loads((ROOT/"scripts/resources.json").read_text())
    for slug,spec in specs.items():
        pdf=fitz.open(ROOT/"assets/downloads"/(slug+".pdf"))
        assert len(pdf)==len(spec["pages"]),f"{slug}: expected {len(spec['pages'])} pages, got {len(pdf)}"
        text="\n".join(page.get_text() for page in pdf)
        assert "\ufffd" not in text
        for page in pdf:
            for block in page.get_text("blocks"):
                assert block[0]>=18 and block[2]<=page.rect.width-18, f"PDF horizontal clipping in {slug}"
                assert block[1]>=10 and block[3]<=page.rect.height-10, f"PDF vertical clipping in {slug}"
        if slug=="progress-challenge-toolkit":
            assert "Three checkpoints" in text
            assert "Two measurements" not in text
        shots=[]
        for page_num in (0,len(pdf)-1):
            pix=pdf[page_num].get_pixmap(matrix=fitz.Matrix(0.85,0.85))
            shots.append(Image.frombytes("RGB",[pix.width,pix.height],pix.samples))
        canvas=Image.new("RGB",(sum(x.width for x in shots),max(x.height for x in shots)),"#dfe3e7")
        offset=0
        for shot in shots:
            canvas.paste(shot,(offset,0));offset+=shot.width
        canvas.save(QA/(slug+"-preview.jpg"),quality=78)
        record(slug+": expected page count, readable text and page bounds")

    with tempfile.TemporaryDirectory() as directory:
        root=Path(directory)
        (root/"seca-campaigns").symlink_to(ROOT,target_is_directory=True)
        server=ThreadingHTTPServer(("127.0.0.1",0),partial(QuietHandler,directory=directory))
        thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
        base=f"http://127.0.0.1:{server.server_port}/seca-campaigns/progress-you-can-prove/"
        with sync_playwright() as p:
            browser=p.chromium.launch()
            context=browser.new_context(viewport={"width":1440,"height":1000},device_scale_factor=1,accept_downloads=True)
            page=context.new_page()
            errors=[]
            page.on("pageerror",lambda error:errors.append(str(error)))
            routes=["","retention/","personal-training/","performance/","premium-experience/","multi-site/"]
            for width in (1440,1024,768,390,320):
                page.set_viewport_size({"width":width,"height":1000 if width>600 else 844})
                for route in routes:
                    response=page.goto(base+route,wait_until="networkidle")
                    assert response.ok
                    assert page.locator("h1").count()==1
                    assert page.evaluate("document.documentElement.scrollWidth<=window.innerWidth+2"), f"Horizontal overflow: {width}, {route}"
                    broken=page.locator("img").evaluate_all("(images)=>images.filter(i=>!i.complete||i.naturalWidth===0).map(i=>i.src)")
                    assert not broken, str(broken)
                    if width in (1440,390):
                        slug=route.strip("/") or "overview"
                        page.screenshot(path=str(QA/(slug+f"-{width}.jpg")),type="jpeg",quality=68)
                record(f"All routes: {width}px layout, main heading and images")
            assert not errors,errors
            record("No browser JavaScript errors")

            page.set_viewport_size({"width":1440,"height":1000})
            page.goto(base+"retention/",wait_until="networkidle")
            assert page.locator("#ret-retained").inner_text()=="30"
            assert page.locator("#ret-revenue").inner_text()=="£14,400"
            page.locator("#ret-churn").fill("0.5")
            assert page.locator("#ret-lost").inner_text()=="15"
            assert page.locator("#ret-retained").inner_text()=="15"
            assert page.locator("#ret-revenue").inner_text()=="£7,200"
            page.locator("#ret-churn").fill("0")
            assert page.locator("#ret-retained").inner_text()=="0"
            page.locator("#ret-members").fill("")
            assert page.locator(".calc-error").is_visible()
            assert page.locator("[data-calculator] [data-save-scenario]").is_disabled()
            page.locator("#ret-members").fill("3000")
            page.locator("#ret-churn").fill("25")
            page.locator(".assumptions summary").first.click()
            page.locator("#ret-include-acquisition").check()
            assert page.locator("#ret-avoided").inner_text()=="£1,500"
            assert page.locator("#ret-revenue").inner_text()=="£14,400"
            page.locator("#calculator").scroll_into_view_if_needed()
            page.screenshot(path=str(QA/"retention-calculator.jpg"),type="jpeg",quality=75)
            with page.expect_download() as item:
                page.locator("[data-calculator] [data-save-scenario]").click()
            download=item.value
            text=Path(download.path()).read_text()
            assert "14" in text and "ASSUMPTIONS" in text
            assert "alex@example.com" not in text
            record("Retention: cap, zero churn, blank validation, separate savings and downloadable scenario")

            page.goto(base+"personal-training/",wait_until="networkidle")
            assert page.locator("#pt-annual").inner_text()=="£9,000"
            page.locator("#pt-conv").fill("105")
            assert page.locator(".calc-error").is_visible()
            assert page.locator("[data-calculator] [data-save-scenario]").is_disabled()
            page.locator("#pt-conv").fill("99")
            page.locator("#pt-uplift").fill("5")
            assert page.locator("#pt-scenario").inner_text()=="100"
            assert page.locator("#pt-annual").inner_text()=="£3,000"
            page.locator("#pt-consults").fill("0")
            assert page.locator("#pt-annual").inner_text()=="£0"
            record("PT: default sales, invalid conversion, 100% cap and zero volume")

            for route,slug in [("performance/","progress-challenge-toolkit"),("premium-experience/","premium-member-experience-guide"),("multi-site/","90-day-pilot-framework")]:
                page.goto(base+route,wait_until="networkidle")
                requests=[]
                listener=lambda request:requests.append(request.url)
                page.on("request",listener)
                form=page.locator("#download [data-demo-form]")
                form.locator("[data-sample]").click()
                form.locator("button[type=submit]").click()
                assert form.locator(".form-message").is_visible()
                page.wait_for_timeout(150)
                assert requests==[],requests
                for extension in ("pdf","csv"):
                    with page.expect_download() as item:
                        form.locator(f"a[download][href$='.{extension}']").click()
                    download=item.value
                    assert download.suggested_filename==slug+"."+extension
                    assert Path(download.path()).stat().st_size>50
                page.remove_listener("request",listener)
                record(slug+": local form preview and both downloads")

            page.goto(base+"retention/",wait_until="networkidle")
            page.locator("[data-demo]").first.click()
            assert page.locator("#demo-dialog").is_visible()
            for i in range(14): page.keyboard.press("Tab")
            assert page.evaluate("document.activeElement.closest('dialog')?.id")=="demo-dialog"
            page.keyboard.press("Escape")
            assert not page.locator("#demo-dialog").is_visible()
            page.locator("[data-strategy]").click()
            assert "membershipValue" in page.locator("#context-preview").inner_text()
            page.keyboard.press("Escape")
            record("Native dialogs: opening, keyboard focus, Escape and scenario context")

            page.set_viewport_size({"width":390,"height":844})
            page.goto(base,wait_until="networkidle")
            page.locator(".nav-toggle").click()
            assert page.locator(".nav-toggle").get_attribute("aria-expanded")=="true"
            page.locator(".nav-links a[href='./performance/']").click()
            assert page.url.endswith("/performance/")
            page.goto(base+"index.html",wait_until="networkidle")
            assert page.locator("#business-priorities .pillar").count()==4
            record("Mobile navigation and explicit index.html route")

            nojs=browser.new_context(java_script_enabled=False)
            plain=nojs.new_page()
            plain.goto(base+"performance/")
            assert plain.locator("#download fieldset").is_disabled()
            assert plain.locator("#download noscript a").is_visible()
            assert plain.locator("#download noscript a").get_attribute("href").endswith(".pdf")
            nojs.close()
            record("No-JavaScript: safe disabled form and direct guide access")
            browser.close()
        server.shutdown()
except Exception as error:
    report["failures"].append(str(error))
    report["traceback"]=traceback.format_exc()
finally:
    (QA/"report.json").write_text(json.dumps(report,indent=2),encoding="utf-8")
if report["failures"]:
    raise RuntimeError(report["traceback"])
print("All campaign checks passed.")
