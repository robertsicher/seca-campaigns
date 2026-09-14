# Progress You Can Prove campaign microsite

Static interview concept for **seca TRU Alpha**. The site is intentionally built with HTML, CSS and vanilla JavaScript so it can be deployed directly through GitHub Pages with no build step.

## 1. File structure

```text
/
  index.html
  README.md
  /progress-you-can-prove/
    index.html
    /retention/index.html
    /personal-training/index.html
    /performance/index.html
    /premium-experience/index.html
    /multi-site/index.html
  /assets/
    /css/styles.css
    /js/main.js
    /images/tru-alpha-placeholder.svg
    /images/favicon.svg
```

All internal URLs are **relative**, so the site works on a GitHub Pages project path such as `username.github.io/repository-name/` rather than only at the domain root.

## 2. Preview locally

You can open `index.html` directly, but a local web server is better for matching GitHub Pages behaviour. From the project folder run, for example:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000/`.

## 3. Deploy through GitHub Pages

1. Create or open a GitHub repository.
2. Upload the contents of this folder to the repository root.
3. In GitHub open **Settings → Pages**.
4. Under **Build and deployment**, select **Deploy from a branch**.
5. Choose the branch (normally `main`) and `/ (root)`.
6. Save and wait for GitHub Pages to publish the site.

## 4. Replacing images

`assets/images/tru-alpha-placeholder.svg` is a clearly labelled product-photography placeholder. Replace it with approved/licensed seca TRU Alpha imagery and update image references if the filename changes. The placeholder exists because this concept should not redistribute copyrighted product imagery without permission.

`assets/images/favicon.svg` is also a placeholder rather than an official seca brand asset.

## 5. Calculator assumptions

Calculator logic is in `assets/js/main.js`. Default assumptions are set in the corresponding HTML inputs.

Key principle: operator-supplied inputs are separated from **hypothesis/scenario assumptions**. No calculator claims that TRU Alpha causes the modelled uplift.

- Retention: `ret-*` fields and the `retention()` function.
- Personal Training: `pt-*` fields and the `pt()` function.
- Premium Experience: `prem-*` fields and the `premium()` function.
- Multi-Site: `multi-*` fields and the `multisite()` function.

Before a real commercial deployment, replace illustrative assumptions with validated customer/pilot data and confirm investment pricing.

## 6. Future HubSpot integration

The forms are intentionally non-transmitting simulations. A live implementation could:

- replace each mock form with a HubSpot embedded form or Forms API integration;
- create custom Contact and Company properties for site count, member base, churn, CAC, campaign interest and calculator outputs;
- pass calculator values into hidden form properties on submit;
- use workflows to branch nurture by Retention, PT, Performance, Premium or Multi-Site interest;
- use HubSpot Company records to aggregate multiple stakeholder interactions into account-level intent;
- validate lead/account scoring weights against actual opportunity creation and closed revenue.

For a production site, add consent/cookie handling and privacy documentation appropriate to the tracking and form configuration used.

## Content / evidence note

The concept draws on current seca materials describing TRU Alpha as a fitness body-composition solution with medical validation, cloud-based interpretation software, integration interfaces and self-measurement workflows. Commercial outcomes such as retention, PT conversion and premium revenue are deliberately presented as scenarios to test rather than product claims.
