#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from urllib.request import urlopen
from urllib.parse import urlencode
from bs4 import BeautifulSoup as BS
import re

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
        dreams.append(L[-2])
    return dreams

