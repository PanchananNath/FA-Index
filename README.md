# FA-Index Google Chrome Extension

A Chrome Browser Extension (Manifest V3) that enhances Google Scholar profile pages by isolating and analyzing a researcher's **first-author paper** contributions. 

It automatically highlights first-author publications, calculates isolated first-author citation counts, and computes a dedicated **FA-Index** (First-Author $h$-index).

---

## Features

1. **Automatic Highlighting**: Automatically identifies and highlights row entries and paper titles on a profile where the profile owner is listed as the primary (first) author.
2. **First-Author Paper & Citation Counters**: Computes the total count of first-author publications and sums their corresponding citation counts.
3. **FA-Index (First-Author Index)**: Calculates a cumulative index modeled after the $h$-index, restricted exclusively to papers where the researcher is the first author.
4. **Seamless UI Integration**: Injects the new metrics directly into the standard Google Scholar metrics sidebar on the right side of the profile.

---

## Understanding the FA-Index

### Definition
The **FA-Index** ($h_{FA}$) adapts Jorge E. Hirsch’s standard $h$-index metric, but restricts the calculation exclusively to publications where the scholar is listed as the **first author**.

> A researcher has an **FA-Index of $h_{FA}$** if they have published **$h_{FA}$ papers as first author**, each of which has been cited at least **$h_{FA}$ times**.

### Mathematical Formulation
Let $P_{FA} = \{p_1, p_2, \dots, p_n\}$ be the set of $n$ papers where the user is the first author, with corresponding citation counts $C = \{c_1, c_2, \dots, c_n\}$. 

If $C$ is sorted in descending order such that $c_1 \ge c_2 \ge \dots \ge c_n$, then:

$$h_{FA} = \max \{ i \in \{1, \dots, n\} \mid c_i \ge i \}$$

### Calculation Example

Consider a scholar with 6 first-author papers having citation counts sorted in descending order:

| Paper Rank ($i$) | Citations ($c_i$) | Condition ($c_i \ge i$) | Result |
| :---: | :---: | :---: | :---: |
| **1** | 42 | $42 \ge 1$ | Pass |
| **2** | 15 | $15 \ge 2$ | Pass |
| **3** | **7** | **$7 \ge 3$** | **Pass** |
| 4 | 3 | $3 \ge 4$ | Fail |
| 5 | 2 | $2 \ge 5$ | Fail |
| 6 | 0 | $0 \ge 6$ | Fail |

* **Result:** The condition holds up to rank **3** (at rank 4, $3 < 4$).
* **FA-Index = 3**.

---

## File Structure

```text
Scholar-FA-Extension/
├── manifest.json   # Browser extension configuration (Manifest V3)
├── content.js      # Core DOM parsing, citation counting, and metric injection
├── styles.css      # Visual styling for row highlighting and new sidebar metrics
└── README.md       # Project documentation
```

---

## Installation Guide

1. **Clone or Create Folder**:
   Create a directory on your local machine named `Scholar-FA-Extension` and save `manifest.json`, `content.js`, and `styles.css` inside it.

2. **Open Chrome Extensions**:
   Open Google Chrome and navigate to `chrome://extensions/` in your address bar.

3. **Enable Developer Mode**:
   Toggle the **Developer mode** switch in the top-right corner of the extensions page.

4. **Load Unpacked Extension**:
   * Click on the **Load unpacked** button in the top-left menu.
   * Select the `Scholar-FA-Extension` folder containing your files.

5. **Verify**:
   Navigate to any public Google Scholar profile (e.g., `https://scholar.google.com/citations?user=...`). You will see:
   * First-author papers highlighted in soft blue.
   * Three new entries (**FA-Papers**, **FA-Citations**, **FA-Index**) added to the sidebar citation table.

---

## Code Overview

### `manifest.json`
Specifies permissions and injects `content.js` and `styles.css` into matches for Google Scholar citation profile URLs (`*://scholar.google.com/citations?*user=*`).

### `content.js`
1. Extracts the profile owner's name from `#gsc_prf_in`.
2. Matches the profile owner's last name against the first entry in the author list (`div.gs_gray`).
3. Appends visual CSS classes to matching publication rows.
4. Accumulates first-author paper counts, sum of citations, and calculates the FA-Index array.
5. Injects the result rows into the sidebar table (`#gsc_rsb_st`).

### `styles.css`
Applies custom styling for highlighted first-author rows and formats sidebar table entries.

---

## Limitations & Edge Cases

* **Initial Matching**: The extension matches based on the last name of the profile owner and the first entry in the author list string. In cases with common surnames, minor overlap can occur if initials match similarly formatted names.
* **Pagination**: Google Scholar initially renders up to 20 or 100 papers. Clicking "Show More" loads dynamic entries; refresh or re-execute the script if needed to recount newly loaded dynamic entries.

---

## Creator 

Er. Panchanan Nath

Moawapang Imsong

## License

MIT License. Free to use, modify, and distribute.


