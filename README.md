# Progress You Can Prove

Independent interview campaign concept by George Robertshaw for seca TRU Alpha. The published website uses HTML, CSS and vanilla JavaScript with no backend.

## Campaign routes

- Overview: customer priorities and an illustrative member progress review.
- Retention: validated scenario with an improvement capped at existing churn. Associated membership value and optional acquisition savings are shown separately.
- Personal training: validated initial-package sales scenario, capped at 100% conversion. Gross package sales may belong to an independent trainer.
- Performance: six-page challenge toolkit and CSV tracker.
- Premium experience: five-page service guide and CSV checklist.
- Multi-site: six-page pilot framework and CSV scorecard, positioned as a later account-development step.

## Hosting

GitHub Pages serves the main branch at /seca-campaigns/. Internal navigation and assets use relative paths. Product photography, PDFs and CSV files are committed in assets, so the published site does not rely on an external image host.

## Forms and measurement

Forms are explicitly labelled interview demonstrations. They transmit and persist no input. JavaScript enables the forms only after their local submit handlers are attached. With JavaScript disabled, download pages provide a direct resource link.

Scenario exports contain business inputs and results, with no personal contact details. There are no analytics calls, cookies or CRM connections. The Campaign strategy dialog explains the proposed live acquisition, qualification, nurture and sales handover, including an example enquiry context.

The progress example is illustrative, with a visible label. Product specifications link to seca's current UK product page.

## Source and maintenance

- assets/js/calculator-models.js: pure scenario models with input validation.
- assets/js/main.js: calculator UI, native dialogs, navigation, local forms and scenario export.
- scripts/resources.json: editable content for the PDFs and CSV worksheets.
- scripts/build_resources.py: generates committed resources and downloads the official photograph once.
- scripts/verify_site.py: checks pages under the GitHub project path in Chromium, checks downloads, exercises calculators and form journeys, and captures review screenshots.

The preparation workflow runs only on the named campaign development branch. It prepares resources, runs checks and commits generated assets and QA evidence to that branch. Publishing to main remains a separate fast-forward step after review.

## Rebuild resources

Install scripts/requirements.txt in a Python environment and run:
```sh
python scripts/build_resources.py
python -m playwright install chromium
python scripts/verify_site.py
```

The website itself has no Python or build-time dependency once assets are committed. Image provenance is recorded in assets/images/CREDITS.md.
