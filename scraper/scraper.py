#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from urllib.request import urlopen
from urllib.parse import urlencode
from bs4 import BeautifulSoup as BS

# Fetch dataset list
dataset_list = BS(urlopen("http://dreambank.net/search.cgi"), "html.parser")
dataset_list = [o['value'] for o in dataset_list
                                    .find("select", {"id": "select:series"})
                                    .find_all("option")]

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
    dream_list = BS(urlopen("http://dreambank.net/search.cgi?" + params))

    dream_list = [o['value'] for o in dream_list.find("select", {"name": "d"})
                                                .find_all("option")]

