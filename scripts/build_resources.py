"""Build the committed PDF/CSV resources and fetch the locally hosted product photograph."""
from pathlib import Path
from html import escape
import csv, io, json, re, urllib.request
from PIL import Image
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "downloads"
OUT.mkdir(parents=True, exist_ok=True)
RED = colors.HexColor("#e30613")
INK = colors.HexColor("#17191d")
MUTED = colors.HexColor("#505963")
LINE = colors.HexColor("#dce0e4")
font_dir = Path("/usr/share/fonts/truetype/dejavu")
if (font_dir / "DejaVuSans.ttf").exists():
    pdfmetrics.registerFont(TTFont("Campaign", str(font_dir / "DejaVuSans.ttf")))
    pdfmetrics.registerFont(TTFont("CampaignBold", str(font_dir / "DejaVuSans-Bold.ttf")))
    pdfmetrics.registerFontFamily("Campaign", normal="Campaign", bold="CampaignBold")
    FONT, BOLD = "Campaign", "CampaignBold"
else:
    FONT, BOLD = "Helvetica", "Helvetica-Bold"

styles = {
 "title": ParagraphStyle("title", fontName=BOLD, fontSize=29, leading=32, textColor=INK, spaceAfter=12),
 "h1": ParagraphStyle("h1", fontName=BOLD, fontSize=22, leading=26, textColor=INK, spaceAfter=11),
 "intro": ParagraphStyle("intro", fontName=FONT, fontSize=11.2, leading=16, textColor=MUTED, spaceAfter=17),
 "h": ParagraphStyle("h", fontName=BOLD, fontSize=12, leading=16, textColor=INK, spaceBefore=10, spaceAfter=7, keepWithNext=True),
 "p": ParagraphStyle("p", fontName=FONT, fontSize=9.6, leading=14, textColor=MUTED, spaceAfter=11),
 "cell": ParagraphStyle("cell", fontName=FONT, fontSize=8.5, leading=12, textColor=INK),
 "th": ParagraphStyle("th", fontName=BOLD, fontSize=8.4, leading=12, textColor=colors.white),
 "copy": ParagraphStyle("copy", fontName=FONT, fontSize=9.6, leading=14.5, textColor=INK),
 "field": ParagraphStyle("field", fontName=BOLD, fontSize=8.5, leading=12, textColor=MUTED),
 "label": ParagraphStyle("label", fontName=BOLD, fontSize=8.3, leading=12, textColor=RED, spaceAfter=12),
}
def markup(text):
    text = escape(str(text))
    text = re.sub(r"https://[^\s<]+", lambda m: '<link href="'+m.group(0)+'" color="#a70009">'+m.group(0)+'</link>', text)
    return text.replace("\n", "<br/>")
def para(text, style="p"):
    return Paragraph(markup(text), styles[style])
def build(slug, resource):
    path = OUT / (slug + ".pdf")
    doc = SimpleDocTemplate(str(path), pagesize=A4, rightMargin=43, leftMargin=43, topMargin=66, bottomMargin=52,
        title=resource["title"].replace("\n"," "), author="George Robertshaw", subject="Independent seca TRU Alpha interview campaign concept")
    width = A4[0] - 86
    def furniture(canvas, doc):
        canvas.saveState()
        canvas.setFillColor(RED)
        canvas.rect(0, A4[1]-7, A4[0], 7, fill=1, stroke=0)
        canvas.setFont(BOLD, 10)
        canvas.drawString(43, A4[1]-34, "Progress You Can Prove")
        canvas.setFont(FONT, 8)
        canvas.setFillColor(MUTED)
        canvas.drawRightString(A4[0]-43, A4[1]-34, resource["label"])
        canvas.setStrokeColor(LINE)
        canvas.line(43, 40, A4[0]-43, 40)
        canvas.setFont(FONT, 6.7)
        canvas.drawString(43, 27, "Independent interview concept by George Robertshaw. Not an official seca publication.")
        canvas.drawRightString(A4[0]-43, 27, str(doc.page))
        canvas.restoreState()
    story=[]
    for index, page in enumerate(resource["pages"]):
        if index:
            story.append(PageBreak())
        else:
            story.extend([para(resource["label"].upper(), "label"), para(resource["title"], "title"), para(resource["subtitle"], "intro")])
        story.extend([para(("%02d / " % (index+1)) + page["title"], "h1"), para(page["intro"], "intro")])
        for block in page["blocks"]:
            kind=block["type"]
            if kind in ("h","p"):
                story.append(para(block["text"], kind))
            elif kind=="field":
                story.extend([para(block["text"], "field"), Table([[""]], colWidths=[width], rowHeights=[19],
                    style=TableStyle([("LINEBELOW",(0,0),(-1,-1),0.6,LINE)])), Spacer(1,10)])
            elif kind=="copy":
                box=Table([[para(block["text"],"copy")]], colWidths=[width])
                box.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,-1),colors.HexColor("#f3f4f4")),("LINEBEFORE",(0,0),(0,-1),3,RED),
                    ("LEFTPADDING",(0,0),(-1,-1),13),("RIGHTPADDING",(0,0),(-1,-1),13),("TOPPADDING",(0,0),(-1,-1),12),("BOTTOMPADDING",(0,0),(-1,-1),12)]))
                story.extend([box, Spacer(1,12)])
            elif kind=="table":
                data=[[para(v,"th") for v in block["headers"]]]+[[para(v,"cell") for v in row] for row in block["rows"]]
                table=Table(data, colWidths=[width*w for w in block["widths"]], repeatRows=1, hAlign="LEFT")
                table.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,0),INK),("ROWBACKGROUNDS",(0,1),(-1,-1),[colors.white,colors.HexColor("#f5f6f6")]),
                    ("VALIGN",(0,0),(-1,-1),"TOP"),("LEFTPADDING",(0,0),(-1,-1),8),("RIGHTPADDING",(0,0),(-1,-1),8),
                    ("TOPPADDING",(0,0),(-1,-1),9),("BOTTOMPADDING",(0,0),(-1,-1),9),("LINEBELOW",(0,0),(-1,-1),0.4,LINE)]))
                story.extend([table, Spacer(1,12)])
    doc.build(story,onFirstPage=furniture,onLaterPages=furniture)
    with (OUT/(slug+".csv")).open("w",encoding="utf-8-sig",newline="") as stream:
        writer=csv.writer(stream)
        writer.writerow(resource["csv"]["headers"])
        writer.writerows(resource["csv"]["rows"])
    print("Built",path.name)

resources=json.loads((ROOT/"scripts/resources.json").read_text())
for slug, resource in resources.items():
    build(slug,resource)

image_dir=ROOT/"assets/images"
target=image_dir/"tru-alpha-fitness.jpg"
if not target.exists():
    candidates=[
      "https://secatru.com/wp-content/uploads/2025/03/seca-TRU-Alpha_Sliderbild03-1024x682.jpg",
      "https://secatru.com/wp-content/uploads/2025/03/seca-TRU-Alpha_Sliderbild01-1-1024x682.jpg",
      "https://secatru.com/wp-content/uploads/2025/03/seca-TRU-Alpha_Sliderbild05.jpg",
    ]
    failures=[]
    for url in candidates:
        try:
            request=urllib.request.Request(url,headers={"User-Agent":"Mozilla/5.0","Referer":"https://secatru.com/"})
            with urllib.request.urlopen(request,timeout=35) as response:
                data=response.read(15000000)
            picture=Image.open(io.BytesIO(data)).convert("RGB")
            if picture.width<600 or picture.height<400:
                raise ValueError("Unexpectedly small product photograph")
            picture.thumbnail((1600,1600))
            picture.save(target,"JPEG",quality=88,optimize=True)
            (image_dir/"CREDITS.md").write_text("# Product photograph\n\nseca TRU Alpha photograph, sourced from seca's official product materials for this independent interview campaign concept.\n\nSource: "+url+"\n\nProduct: https://secatru.com/en-gb/products/seca-tru-alpha\n",encoding="utf-8")
            print("Saved local product photograph",picture.size)
            break
        except Exception as error:
            failures.append(str(error))
    else:
        raise RuntimeError("Could not retrieve official product imagery: "+"; ".join(failures))
