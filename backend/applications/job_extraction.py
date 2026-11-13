
import gzip
import ipaddress
import json
import re
import socket
import zlib
from html import unescape
from html.parser import HTMLParser
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin, urlparse
from urllib.request import HTTPRedirectHandler, Request, build_opener


class JobPageParser(HTMLParser):
    void_tags = {
        "area", "base", "br", "col", "embed", "hr", "img", "input",
        "link", "meta", "param", "source", "track", "wbr"
    }

    capture_classes = {
        "listing-company",
        "company-name",
        "listing-location",
        "job-description",
        "job-title",
        "job-company",
        "job-location",
        "job-description-text"
    }

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.title_parts = []
        self.meta = {}
        self.json_ld = []
        self.captures = {}
        self.active_captures = []
        self.tag_stack = []
        self.in_title = False
        self.script_type = ""
        self.script_parts = []

    def handle_starttag(self, tag, attrs):
        attributes = dict(attrs)
        classes = set((attributes.get("class") or "").split())

        if tag == "title":
            self.in_title = True

        if tag == "meta":
            name = (
                attributes.get("property")
                or attributes.get("name")
                or attributes.get("itemprop")
                or ""
            ).lower()
            content = attributes.get("content", "")
            if name and content:
                self.meta[name] = unescape(content).strip()

        if tag == "script":
            self.script_type = attributes.get("type", "").lower()
            self.script_parts = []

        if tag not in self.void_tags:
            self.tag_stack.append(tag)
            for capture in self.active_captures:
                capture["depth"] += 1

        for class_name in classes.intersection(self.capture_classes):
            self.active_captures.append({
                "class": class_name,
                "tag": tag,
                "depth": 0,
                "parts": []
            })

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        self.handle_endtag(tag)

    def handle_data(self, data):
        if self.in_title:
            self.title_parts.append(data)

        if self.script_type == "application/ld+json":
            self.script_parts.append(data)

        for capture in self.active_captures:
            capture["parts"].append(data)

    def handle_endtag(self, tag):
        if tag == "title":
            self.in_title = False

        if tag == "script":
            if self.script_type == "application/ld+json":
                raw = "".join(self.script_parts).strip()
                if raw:
                    try:
                        self.json_ld.append(json.loads(raw))
                    except (json.JSONDecodeError, TypeError):
                        pass
            self.script_type = ""
            self.script_parts = []

        for capture in list(self.active_captures):
            if capture["tag"] == tag and capture["depth"] == 0:
                value = clean_text(" ".join(capture["parts"]))
                self.captures.setdefault(capture["class"], []).append(value)
                self.active_captures.remove(capture)
            else:
                capture["depth"] = max(0, capture["depth"] - 1)

        if tag in self.tag_stack:
            while self.tag_stack:
                current = self.tag_stack.pop()
                if current == tag:
                    break


def clean_text(value):
    value = unescape(value or "")
    value = re.sub(r"\s+", " ", value)
    return value.strip()


def normalize_description(value):
    if isinstance(value, list):
        value = " ".join(str(item) for item in value)
    if not isinstance(value, str):
        return ""
    value = re.sub(r"<(script|style)\b[^>]*>.*?</\1>", " ", value, flags=re.I | re.S)
    value = re.sub(r"<br\s*/?>", "\n", value, flags=re.I)
    value = re.sub(r"</(p|div|li|h[1-6]|section|article|tr)>", "\n", value, flags=re.I)
    value = re.sub(r"<[^>]+>", " ", value)
    value = unescape(value)
    value = re.sub(r"[ \t]+", " ", value)
    value = re.sub(r"\n\s*\n+", "\n\n", value)
    return value.strip()


def validate_url(url):
    parsed = urlparse(url)

    if parsed.scheme not in {"http", "https"}:
        raise ValueError("Only HTTP and HTTPS job URLs are supported.")

    if not parsed.hostname:
        raise ValueError("The job URL is invalid.")

    if parsed.username or parsed.password:
        raise ValueError("URLs containing login credentials are not supported.")

    hostname = parsed.hostname.lower()

    if hostname == "localhost" or hostname.endswith(".localhost") or hostname.endswith(".local"):
        raise ValueError("This URL is not allowed.")

    try:
        addresses = {ipaddress.ip_address(hostname)}
    except ValueError:
        try:
            results = socket.getaddrinfo(hostname, None, type=socket.SOCK_STREAM)
            addresses = {ipaddress.ip_address(result[4][0]) for result in results}
        except socket.gaierror as exc:
            raise ValueError("The job website could not be reached.") from exc

    if not addresses:
        raise ValueError("The job website could not be reached.")

    for address in addresses:
        if not address.is_global:
            raise ValueError("This URL points to a restricted network address.")

    return url


def is_python_job_board(url):
    parsed = urlparse(url)
    hostname = (parsed.hostname or "").lower()
    path = parsed.path.rstrip("/")

    return (
        hostname == "python.org" or hostname.endswith(".python.org")
    ) and path == "/jobs"


class SafeRedirectHandler(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        target = urljoin(req.full_url, newurl)
        validate_url(target)
        return super().redirect_request(req, fp, code, msg, headers, target)


def decode_response(content, content_encoding="", charset="utf-8"):
    encoding = (content_encoding or "").lower().strip()

    try:
        if "gzip" in encoding:
            content = gzip.decompress(content)
        elif "deflate" in encoding:
            try:
                content = zlib.decompress(content)
            except zlib.error:
                content = zlib.decompress(content, -zlib.MAX_WBITS)
    except (OSError, EOFError, zlib.error):
        pass

    try:
        return content.decode(charset or "utf-8", errors="replace")
    except LookupError:
        return content.decode("utf-8", errors="replace")


def fetch_job_page(url):
    validate_url(url)

    request = Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Encoding": "gzip, deflate",
            "Accept-Language": "en-US,en;q=0.9"
        }
    )

    opener = build_opener(SafeRedirectHandler)

    try:
        with opener.open(request, timeout=25) as response:
            final_url = response.geturl()
            validate_url(final_url)

            if is_python_job_board(final_url):
                raise ValueError(
                    "This page contains multiple job listings. Please open an individual job posting URL."
                )

            content_type = response.headers.get("Content-Type", "")
            if content_type and not any(
                item in content_type.lower()
                for item in ("text/html", "application/xhtml+xml", "text/plain")
            ):
                raise ValueError("This URL does not return a supported web page.")

            charset_match = re.search(r"charset=([^\s;]+)", content_type, re.I)
            charset = charset_match.group(1).strip("\"'") if charset_match else "utf-8"

            html = decode_response(
                response.read(5_000_000),
                response.headers.get("Content-Encoding", ""),
                charset
            )

            return html, final_url

    except HTTPError as exc:
        raise ValueError(f"The job website returned HTTP {exc.code}.") from exc
    except URLError as exc:
        raise ValueError("Unable to access this job page. Please check the URL and try again.") from exc
    except TimeoutError as exc:
        raise ValueError("The job website took too long to respond.") from exc


def iter_json_ld_items(value):
    if isinstance(value, list):
        for item in value:
            yield from iter_json_ld_items(item)
    elif isinstance(value, dict):
        graph = value.get("@graph")
        if isinstance(graph, list):
            for item in graph:
                yield from iter_json_ld_items(item)
        yield value


def get_json_ld_job(parser):
    for document in parser.json_ld:
        for item in iter_json_ld_items(document):
            item_type = item.get("@type", [])
            if isinstance(item_type, str):
                item_type = [item_type]
            if any(str(value).lower() == "jobposting" for value in item_type):
                return item
    return {}


def get_name(value):
    if isinstance(value, dict):
        return clean_text(value.get("name", ""))
    if isinstance(value, list):
        for item in value:
            result = get_name(item)
            if result:
                return result
    return clean_text(value) if isinstance(value, str) else ""


def extract_work_mode(description, source_text=""):
    text = f"{description or ''} {source_text or ''}".lower()

    if re.search(r"\bhybrid\b", text):
        return "hybrid"

    remote_positive = re.search(
        r"\b(remote[- ]first|fully remote|100%\s*remote|work from anywhere|remote position|remote work|telecommut(?:e|ing) available|remote)\b",
        text
    )
    remote_negative = re.search(
        r"\b(no remote|not remote|no telecommuting|not eligible for remote|on[- ]site only|onsite only|office[- ]based only)\b",
        text
    )

    if remote_positive and not remote_negative:
        return "remote"

    if re.search(r"\b(on[- ]site|onsite|in[- ]office|office[- ]based|no telecommuting)\b", text):
        return "onsite"

    return "unknown"


def extract_python_org_job(html, url):
    parser = JobPageParser()
    parser.feed(html)
    parser.close()

    metadata_title = (
        parser.meta.get("og:title")
        or parser.meta.get("twitter:title")
        or ""
    )

    title = clean_text(" ".join(parser.title_parts))
    title = re.sub(r"\s*\|\s*Python\.org\s*$", "", title, flags=re.I)

    if metadata_title:
        match = re.match(r"Job:\s*(.*?)\s+at\s+(.+)$", metadata_title, re.I)
        if match:
            title = clean_text(match.group(1))

    listing_parts = parser.captures.get("listing-company", [])
    company_parts = parser.captures.get("company-name", [])
    location_parts = parser.captures.get("listing-location", [])
    description_parts = parser.captures.get("job-description", [])

    company = ""
    location = ""
    description = ""

    if company_parts:
        company_text = company_parts[0]
        company_text = re.sub(r"\bNew\b", " ", company_text, flags=re.I)
        if title:
            company_text = re.sub(re.escape(title), " ", company_text, flags=re.I)
        company = clean_text(company_text)

    if not company and metadata_title:
        match = re.match(r"Job:\s*.*?\s+at\s+(.+)$", metadata_title, re.I)
        if match:
            company = clean_text(match.group(1))

    if location_parts:
        location = clean_text(location_parts[0])

    if description_parts:
        description = normalize_description(" ".join(description_parts))

    if not title and listing_parts:
        listing_text = listing_parts[0]
        if company:
            listing_text = re.sub(re.escape(company), " ", listing_text, flags=re.I)
        if location:
            listing_text = re.sub(re.escape(location), " ", listing_text, flags=re.I)
        title = clean_text(listing_text)

    if not description:
        description = normalize_description(
            parser.meta.get("og:description")
            or parser.meta.get("description")
            or ""
        )

    return {
        "job_url": url,
        "job_title": title,
        "company_name": company,
        "location": location,
        "work_mode": extract_work_mode(description, " ".join(listing_parts)),
        "job_description": description
    }


def extract_generic_job(html, url):
    parser = JobPageParser()
    parser.feed(html)
    parser.close()

    job = get_json_ld_job(parser)

    title = clean_text(job.get("title", ""))
    company = get_name(job.get("hiringOrganization", ""))
    location = ""
    description = normalize_description(job.get("description", ""))

    job_location = job.get("jobLocation", [])
    if isinstance(job_location, dict):
        job_location = [job_location]

    locations = []

    for item in job_location if isinstance(job_location, list) else []:
        if not isinstance(item, dict):
            continue

        address = item.get("address", {})
        if isinstance(address, str):
            locations.append(clean_text(address))
            continue

        if isinstance(address, dict):
            parts = [
                address.get("addressLocality", ""),
                address.get("addressRegion", ""),
                address.get("postalCode", ""),
                address.get("addressCountry", "")
            ]
            formatted = ", ".join(clean_text(str(part)) for part in parts if part)
            if formatted:
                locations.append(formatted)

    location = clean_text("; ".join(dict.fromkeys(locations)))

    if not title:
        title = clean_text(
            parser.meta.get("og:title")
            or parser.meta.get("twitter:title")
            or " ".join(parser.title_parts)
        )
        title = re.sub(r"\s*[|–-]\s*[^|–-]*$", "", title).strip()

    if not company:
        company = clean_text(
            parser.meta.get("og:site_name")
            or parser.meta.get("application-name")
            or ""
        )

    if not description:
        description = normalize_description(
            parser.meta.get("og:description")
            or parser.meta.get("description")
            or ""
        )

    return {
        "job_url": url,
        "job_title": title,
        "company_name": company,
        "location": location,
        "work_mode": extract_work_mode(description, location),
        "job_description": description
    }


def extract_job_details(url):
    validate_url(url)

    if is_python_job_board(url):
        raise ValueError(
            "This page contains multiple job listings. Please open an individual job posting URL."
        )

    html, final_url = fetch_job_page(url)

    if is_python_job_board(final_url):
        raise ValueError(
            "This page contains multiple job listings. Please open an individual job posting URL."
        )

    hostname = (urlparse(final_url).hostname or "").lower()

    if hostname == "python.org" or hostname.endswith(".python.org"):
        result = extract_python_org_job(html, final_url)
    else:
        result = extract_generic_job(html, final_url)

    if not result.get("job_title"):
        raise ValueError("Could not identify the job title on this page.")

    return result


def extract_job_from_url(url):
    return extract_job_details(url)
