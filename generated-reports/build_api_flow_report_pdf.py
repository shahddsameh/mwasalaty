from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
)


OUT_DIR = Path(__file__).resolve().parent
PDF_PATH = OUT_DIR / "mwaslaty-api-flow-support-review.pdf"


BLUE = colors.HexColor("#1F4D78")
LIGHT_BLUE = colors.HexColor("#E8EEF5")
LIGHT_GRAY = colors.HexColor("#F2F4F7")
GREEN = colors.HexColor("#DFF3E6")
AMBER = colors.HexColor("#FFF2CC")
RED = colors.HexColor("#FCE4E4")
BORDER = colors.HexColor("#DADCE0")
MUTED = colors.HexColor("#555555")


def styles():
    base = getSampleStyleSheet()
    base.add(ParagraphStyle(
        name="TitleCentered",
        parent=base["Title"],
        fontName="Helvetica-Bold",
        fontSize=21,
        leading=26,
        textColor=BLUE,
        alignment=TA_CENTER,
        spaceAfter=8,
    ))
    base.add(ParagraphStyle(
        name="SubtitleCentered",
        parent=base["BodyText"],
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        textColor=MUTED,
        alignment=TA_CENTER,
        spaceAfter=18,
    ))
    base.add(ParagraphStyle(
        name="H1Custom",
        parent=base["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=15,
        leading=18,
        textColor=BLUE,
        spaceBefore=12,
        spaceAfter=6,
    ))
    base.add(ParagraphStyle(
        name="BodyCustom",
        parent=base["BodyText"],
        fontName="Helvetica",
        fontSize=9.4,
        leading=12.5,
        spaceAfter=7,
    ))
    base.add(ParagraphStyle(
        name="SmallCell",
        parent=base["BodyText"],
        fontName="Helvetica",
        fontSize=7.4,
        leading=9.2,
        spaceAfter=0,
    ))
    base.add(ParagraphStyle(
        name="SmallCellBold",
        parent=base["SmallCell"],
        fontName="Helvetica-Bold",
        textColor=BLUE,
    ))
    return base


STYLES = styles()


def p(text, style="BodyCustom"):
    return Paragraph(text, STYLES[style])


def bullet(text):
    return p(f"&bull; {text}")


def heading(text):
    return p(text, "H1Custom")


def make_table(headers, rows, col_widths, header_fill=LIGHT_BLUE, status_col=None):
    data = [[p(h, "SmallCellBold") for h in headers]]
    for row in rows:
        data.append([p(str(cell), "SmallCell") for cell in row])

    table = Table(data, colWidths=col_widths, repeatRows=1, hAlign="CENTER")
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), header_fill),
        ("GRID", (0, 0), (-1, -1), 0.5, BORDER),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))

    if status_col is not None:
        for row_idx, row in enumerate(rows, start=1):
            status = row[status_col]
            if status == "Client-only":
                fill = GREEN
            elif "Partial" in status or "Mostly" in status:
                fill = AMBER
            else:
                fill = RED
            table.setStyle(TableStyle([("BACKGROUND", (status_col, row_idx), (status_col, row_idx), fill)]))
    return table


def footer(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 7.5)
    canvas.setFillColor(MUTED)
    canvas.drawString(0.75 * inch, 0.45 * inch, "Mwaslaty API review")
    canvas.drawRightString(7.75 * inch, 0.45 * inch, f"Page {doc.page}")
    canvas.restoreState()


def build():
    doc = SimpleDocTemplate(
        str(PDF_PATH),
        pagesize=letter,
        rightMargin=0.65 * inch,
        leftMargin=0.65 * inch,
        topMargin=0.65 * inch,
        bottomMargin=0.7 * inch,
        title="Mwaslaty API Flow Support Review",
        author="Codex",
    )

    story = [
        p("Mwaslaty API Flow Support Review", "TitleCentered"),
        p("Backend support assessment for the six product flows and key edge cases", "SubtitleCentered"),
        heading("Executive Summary"),
        p("The current backend exposes one route-planning endpoint, <b>POST /api/plan</b>. It is a strong first slice for route search and comparison, but it is not yet a full product API for navigation, AI trip planning, saved account data, payments, tickets, scanning, or operator workflows."),
        p("Existing support includes route search, route cards, estimated fares, transfers, modes, leg instructions, and basic OTP-related errors. Most remaining flows require new backend contracts and domain-specific error codes."),
        heading("Current API Surface"),
        bullet("POST /api/plan validates from.lat, from.lng, to.lat, to.lng, date, and time."),
        bullet("Optional preferences include modes and optimizeFor."),
        bullet("Successful responses include planId, source, optimizedFor, from, to, itineraries, legs, durationMinutes, totalFare, transfers, summary, route names, and basic instructions."),
        bullet("Current error codes: VALIDATION_ERROR, OTP_EMPTY_PLAN, OTP_SERVICE_UNAVAILABLE, OTP_GRAPHQL_ERROR, and INTERNAL_SERVER_ERROR."),
        heading("Six Flow Support Matrix"),
    ]

    flow_rows = [
        ("Flow 1: Plan A to B", "Partial", "POST /api/plan supports coordinates, date/time, modes, route search, route results, and no-route handling. Missing geocoding/autocomplete and AI prompt parsing."),
        ("Flow 2: Compare route options", "Partial", "Route cards include duration, estimated fare, transfers, modes, summary, and legs. Sorting exists for quickest, cheapest, most_comfortable, and reliable. Missing formal comfort score and route detail endpoint."),
        ("Flow 3: Follow step-by-step", "Mostly missing", "Legs include basic instructions, times, distances, and stops. Missing navigation sessions, GPS updates, deviation detection, recalculation, offline sync, arrival confirmation, and feedback."),
        ("Flow 4: Save places/routes", "Client-only", "The diagram stores data in IndexedDB, so no backend is required for local-only saving. Server sync endpoints are missing if account-based saved screens are needed."),
        ("Flow 5: AI Trip Planner", "Missing", "No endpoint for AI prompt analysis, budget/duration parsing, attractions/restaurants, multi-day schedules, cost breakdown, save, or share."),
        ("Flow 6: Booking and payment", "Missing", "No booking, quote, payment, ticket generation, QR payload, validation status, ticket scan, refund, or operator authorization API."),
    ]
    story.append(make_table(
        ("Flow", "Support", "Evidence and gaps"),
        flow_rows,
        (1.45 * inch, 0.95 * inch, 4.75 * inch),
        status_col=1,
    ))
    story.append(Spacer(1, 8))

    story += [
        heading("Missing Endpoints"),
        bullet("GET /api/places/search for destination suggestions and autocomplete."),
        bullet("POST /api/ai/route-intent for natural-language route requests."),
        bullet("GET /api/plans/:planId or GET /api/routes/:itineraryId for route detail reload."),
        bullet("POST /api/navigation/sessions, PATCH /api/navigation/sessions/:id/location, and POST /api/navigation/sessions/:id/recalculate."),
        bullet("POST /api/feedback."),
        bullet("Saved data endpoints if account sync is required: /api/saved/places and /api/saved/routes."),
        bullet("POST /api/ai/trips for the AI Trip Planner."),
        bullet("POST /api/bookings/quote, POST /api/bookings, POST /api/payments/confirm."),
        bullet("GET /api/tickets/:ticketId and POST /api/tickets/:ticketId/scan."),
        bullet("Authentication and operator authorization endpoints."),
        heading("Missing Fields"),
        bullet("Route geometry or polyline for map rendering."),
        bullet("Stop IDs, GTFS IDs, platform names, and coordinates per leg."),
        bullet("Detailed step list per leg beyond a single instruction string."),
        bullet("fare.status, fare.source, and fareConfidence."),
        bullet("comfortScore, crowding, disruption alerts, realtime delay, and accessibility metadata."),
        bullet("Ticket eligibility, bookingId, paymentId, ticketId, qrPayload, expiresAt, and validationStatus."),
        bullet("Offline/cache metadata such as cacheable, validUntil, and lastSyncedAt."),
        heading("Missing Error Codes"),
        bullet("GEOCODING_NO_MATCH, AI_PARSE_FAILED, ROUTE_OUTSIDE_SERVICE_HOURS, ROUTE_PARTIAL_ONLY, FARE_UNKNOWN."),
        bullet("NAVIGATION_OFFLINE_NO_CACHE, NAVIGATION_LOCATION_UNAVAILABLE, ROUTE_DEVIATION_RECALCULATION_FAILED."),
        bullet("PAYMENT_FAILED, TICKET_EXPIRED, TICKET_ALREADY_USED, TICKET_WRONG_LEG, TICKET_SCAN_OFFLINE_PENDING."),
        bullet("AUTH_REQUIRED, FORBIDDEN, OPERATOR_UNAUTHORIZED."),
        PageBreak(),
        heading("Edge Case Response Matrix"),
    ]

    edge_rows = [
        ("No results", "404", "OTP_EMPTY_PLAN", "Return error details with from, to, date, and time. Current API already does this for empty itineraries."),
        ("Partial routes", "200 or 409", "ROUTE_PARTIAL_ONLY", "Return status partial with available legs, unavailable legs, and whether booking/navigation can continue."),
        ("Fare unknown", "200", "FARE_UNKNOWN warning", "Return fare amount null, currency EGP, status unknown, and fareConfidence 0 rather than silently using 0."),
        ("Off-hours", "422", "ROUTE_OUTSIDE_SERVICE_HOURS", "Return service window, timezone Africa/Cairo, and next available service time."),
        ("Signal loss mid-trip", "200/503", "NAVIGATION_LOCATION_UNAVAILABLE", "Keep session in offline_tracking when cached route exists. If server action is required, return recoverable unavailable error."),
        ("Ticket scanned twice", "409", "TICKET_ALREADY_USED", "Return original scannedAt, stationId, legId, and ticket status used."),
        ("Wrong-leg scan", "409", "TICKET_WRONG_LEG", "Return expected leg/route and scanned leg/route. Do not validate the ticket."),
        ("Expired ticket", "410", "TICKET_EXPIRED", "Return expiresAt and optional rebook action metadata."),
        ("Scan while offline", "202 or 503", "TICKET_SCAN_OFFLINE_PENDING", "Accept signed offline QR scans as pending sync. Otherwise require online validation."),
        ("Operator not authorized", "403", "OPERATOR_UNAUTHORIZED", "Reject scan request without leaking ticket details. Include required operator scope."),
    ]
    story.append(make_table(
        ("Edge case", "HTTP", "Code", "Expected API response"),
        edge_rows,
        (1.3 * inch, 0.7 * inch, 1.75 * inch, 3.4 * inch),
        header_fill=LIGHT_GRAY,
    ))
    story += [
        Spacer(1, 8),
        heading("Recommended Next API Slice"),
        p("The most useful next backend increment is to harden route planning before starting payment or AI workflows."),
        bullet("Add place search/autocomplete and route detail reload."),
        bullet("Add route geometry, stop IDs, fare status, and comfort/reliability metadata."),
        bullet("Separate no-route, off-hours, partial-route, and fare-unknown responses."),
        bullet("Then add navigation sessions and feedback."),
        bullet("Treat booking, payment, tickets, and operator scanning as a later bounded module with its own security model."),
    ]

    doc.build(story, onFirstPage=footer, onLaterPages=footer)
    print(PDF_PATH)


if __name__ == "__main__":
    build()
