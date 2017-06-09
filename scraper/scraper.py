#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from urllib.request import urlopen
from bs4 import BeautifulSoup as BS

# Fetch dataset list
dataset_list = BS(urlopen("http://dreambank.net/search.cgi"), "html.parser")
dataset_list = [o['value'] for o in dataset_list
                                    .find("select", {"id": "select:series"})
                                    .find_all("option")]

