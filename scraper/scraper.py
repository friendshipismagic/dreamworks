#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from urllib.request import urlopen
from urllib.parse import urlencode
from bs4 import BeautifulSoup as BS
import re, csv

def scrape_dataset_list():
    # Fetch dataset list
    dataset_list = BS(urlopen("http://dreambank.net/grid.cgi"), "html.parser")
    dataset_list = {tr[5].find("input")['value']: { "sex": tr[7].text, "title": tr[1].text }
                    for tr in [[i for i in e.children]
                               for e in dataset_list.find_all("tr", {"align": "center"})]}
    return dataset_list

def scrape_dataset(name):
    # Fetch dream list
    params = urlencode({
        "frames": 0,
        "submitted": 1,
        "filter": "",
        "query": ".",
        "series": name,
        "mode": "AND",
        "subtotals": 1,
        "cs": "",
        "rd_table": 1,
        "ss": 100
    });
    dream_list = BS(urlopen("http://dreambank.net/search.cgi?" + params), "html.parser")

    dream_list = [o['value'] for o in dream_list.find("select", {"name": "d"})
                                                .find_all("option")]

    # Craft params for the final request
    data = urlencode([
        ("series", name),
        ("mode", "AND"),
        ("query", "."),
        ("cs", ""),
        ("full_search_query", params),
        ("blacklist", ""),
        ("countwords", 1)
    ])
    data += "&" + ("&".join(["d=" + n for n in dream_list]))
    dreams_tags = BS(urlopen("http://dreambank.net/show.cgi", str.encode(data)), "html.parser")

    dreams = []
    for tag in dreams_tags.find_all("input", {"type": "checkbox", "name": "d"}):
        L = [i for i in tag.next_siblings]

        # There are several date formats in this f***ing dataset
        m = (
            re.search(r"\(([^/]+)/([^/]+)/([^/]+)\)", L[2]),    # MM/DD/YY
            re.search(r"\(([^\-]+)-([^\-]+)-([^\-]+)\)", L[2]), # YY-MM-DD
            re.search(r"\(\s*([0-9]+)\??(/\d{4})?(\s*\(\w+\))?\)", L[2]), # YYYY
            re.search(r"\((\w+) *(\d+)?, (\d+)\)", L[2]),       # Month DD, YYYY
            re.search(r"\([FM], age (\d+)\)", L[2])             # Gives age of the dreamer ...
        )

        months = [
            "january", "february", "march", "april", "may", "june",
            "july", "august", "september", "october", "november", "december"
        ]
        if m[0] is not None:
            date = { "y": m[0].group(3), "m": m[0].group(1), "d": m[0].group(2) }
        elif m[1] is not None:
            date = { "y": m[1].group(1), "m": m[1].group(2), "d": m[1].group(3) }
        elif m[2] is not None:
            date = { "y": m[2].group(1), "m": "1", "d": "1" }
        elif m[3] is not None:
            date = {
                "y": m[3].group(3),
                "m": months.index(m[3].group(1).lower()) + 1,
                "d": m[3].group(2)
            }
            if date["d"] is None: date["d"] = "01"
        elif m[4] is not None:
            date = { "y": str(int(m[4].group(1)) + 1998), "m": "01", "d": "01" }
        else:
            print("Unrecognized date " + L[2])
            date = { "y": "0000", "m": "01", "d": "01" }

        if date['y'] == "??": date['y'] = "01"
        if date['m'] == "??": date['m'] = "01"
        if date['d'] == "??": date['d'] = "01"
        if len(date['y']) == 2: date['y'] = "19" + date['y']
        date['y'] = int(date['y'])
        date['m'] = int(date['m'])
        date['d'] = int(date['d'])

        dreams.append({
            "text": L[-2],
            "date": date
        })
    return dreams

# Scrape dataset list
dataset = scrape_dataset_list()

# Scrape interesting datasets
to_scrape = [
    "angie", "bea2", "chris", "chuck", "edna", "emmas_husband", "jasmine1",
    "jeff", "mark", "midwest_teens-f", "midwest_teens-m", "phil1",
    "physiologist", "ringo", "vickie", "vietnam_vet", "wedding"
]
for name in to_scrape:
    dreams = scrape_dataset(name)
    dataset[name]['dreams'] = dreams

# Save to CSV
with open("dataset.csv", "w") as csvfile:
    writer = csv.DictWriter(csvfile, fieldnames=[
        "text", "date", "gender", "dataset", "title"
    ])

    writer.writeheader()
    for name in to_scrape:
        data = dataset[name]
        for dream in data['dreams']:
            writer.writerow({
                "text": dream["text"],
                "date": "{}-{}-{}".format(
                    dream["date"]["y"],
                    dream["date"]["m"],
                    dream["date"]["d"]
                ),
                "gender": data["sex"],
                "dataset": name,
                "title": data["title"]
            })

