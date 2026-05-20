from __future__ import annotations

from html import escape
from pathlib import Path
from textwrap import wrap

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(r"D:\veltrix")
OUT = Path(r"C:\Users\DEV\Desktop\veltrix-sde-preparation-guide.pdf")

PAGE = landscape(A4)
WIDTH, HEIGHT = PAGE
MARGIN = 0.42 * inch

NAVY = colors.HexColor("#172033")
INK = colors.HexColor("#253044")
MUTED = colors.HexColor("#5f6b7a")
LINE = colors.HexColor("#c8d1dc")
BG = colors.HexColor("#f6f8fb")
GREEN = colors.HexColor("#dff4e8")
BLUE = colors.HexColor("#dfeeff")
AMBER = colors.HexColor("#fff0cc")
RED = colors.HexColor("#ffe3e3")
PURPLE = colors.HexColor("#eee6ff")
GRAY = colors.HexColor("#eef2f6")


styles = getSampleStyleSheet()
styles.add(
    ParagraphStyle(
        name="TitleBig",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=25,
        leading=30,
        textColor=NAVY,
        alignment=TA_CENTER,
        spaceAfter=10,
    )
)
styles.add(
    ParagraphStyle(
        name="SubTitle",
        parent=styles["BodyText"],
        fontSize=10.5,
        leading=14,
        textColor=MUTED,
        alignment=TA_CENTER,
        spaceAfter=14,
    )
)
styles.add(
    ParagraphStyle(
        name="H1x",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=16,
        leading=20,
        textColor=NAVY,
        spaceBefore=4,
        spaceAfter=7,
    )
)
styles.add(
    ParagraphStyle(
        name="H2x",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=15,
        textColor=INK,
        spaceBefore=8,
        spaceAfter=5,
    )
)
styles.add(
    ParagraphStyle(
        name="Bodyx",
        parent=styles["BodyText"],
        fontSize=8.5,
        leading=11.2,
        textColor=INK,
        spaceAfter=5,
    )
)
styles.add(
    ParagraphStyle(
        name="Smallx",
        parent=styles["BodyText"],
        fontSize=7.2,
        leading=9.2,
        textColor=INK,
    )
)
styles.add(
    ParagraphStyle(
        name="Tinyx",
        parent=styles["BodyText"],
        fontSize=6.2,
        leading=7.7,
        textColor=INK,
    )
)
styles.add(
    ParagraphStyle(
        name="BoxTitle",
        parent=styles["BodyText"],
        fontName="Helvetica-Bold",
        fontSize=7.2,
        leading=8.7,
        textColor=NAVY,
        alignment=TA_CENTER,
    )
)
styles.add(
    ParagraphStyle(
        name="BoxText",
        parent=styles["BodyText"],
        fontSize=6.15,
        leading=7.3,
        textColor=INK,
        alignment=TA_CENTER,
    )
)
styles.add(
    ParagraphStyle(
        name="LaneHead",
        parent=styles["BodyText"],
        fontName="Helvetica-Bold",
        fontSize=7,
        leading=8.5,
        textColor=colors.white,
        alignment=TA_CENTER,
    )
)


def P(text: str, style: str = "Bodyx") -> Paragraph:
    return Paragraph(escape(text), styles[style])


def code(text: str) -> str:
    return f"<font name='Courier'>{text}</font>"


def footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(LINE)
    canvas.line(MARGIN, 0.36 * inch, WIDTH - MARGIN, 0.36 * inch)
    canvas.setFont("Helvetica", 7)
    canvas.setFillColor(MUTED)
    canvas.drawString(MARGIN, 0.2 * inch, "Veltrix SDE Preparation Guide - workflow-fixed edition")
    canvas.drawRightString(WIDTH - MARGIN, 0.2 * inch, f"Page {doc.page}")
    canvas.restoreState()


def chip(text: str, fill=GRAY):
    t = Table([[P(text, "Smallx")]], colWidths=[2.45 * inch])
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), fill),
                ("BOX", (0, 0), (-1, -1), 0.6, LINE),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    return t


def matrix(headers, rows, widths=None, header_bg=NAVY, font="Smallx"):
    data = [[P(h, "LaneHead") for h in headers]]
    for row in rows:
        data.append([P(str(c), font) for c in row])
    if widths is None:
        widths = [(WIDTH - 2 * MARGIN) / len(headers)] * len(headers)
    tbl = Table(data, colWidths=widths, repeatRows=1, hAlign="LEFT")
    tbl.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), header_bg),
                ("GRID", (0, 0), (-1, -1), 0.45, LINE),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 4),
                ("RIGHTPADDING", (0, 0), (-1, -1), 4),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, BG]),
            ]
        )
    )
    return tbl


def box(title: str, body: str, fill=GRAY):
    return Table(
        [[P(title, "BoxTitle")], [P(body, "BoxText")]],
        colWidths=[1.37 * inch],
        rowHeights=[0.22 * inch, 0.52 * inch],
        style=TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), fill),
                ("BOX", (0, 0), (-1, -1), 0.75, colors.HexColor("#6d7a8a")),
                ("LINEBELOW", (0, 0), (0, 0), 0.45, colors.HexColor("#a7b2bf")),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 3),
                ("RIGHTPADDING", (0, 0), (-1, -1), 3),
                ("TOPPADDING", (0, 0), (-1, -1), 2),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
            ]
        ),
    )


def arrow(label: str = ""):
    return Table(
        [[P("->", "BoxTitle")], [P(label, "BoxText")]],
        colWidths=[0.42 * inch],
        rowHeights=[0.28 * inch, 0.46 * inch],
        style=TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("TEXTCOLOR", (0, 0), (-1, -1), MUTED),
            ]
        ),
    )


def flow_row(nodes):
    cells = []
    widths = []
    for i, item in enumerate(nodes):
        if i:
            cells.append(arrow(item.get("via", "")))
            widths.append(0.42 * inch)
        cells.append(box(item["title"], item["body"], item.get("fill", GRAY)))
        widths.append(1.37 * inch)
    tbl = Table([cells], colWidths=widths, hAlign="LEFT")
    tbl.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "MIDDLE")]))
    return tbl


def swimlane(lanes, steps):
    header = [P(l, "LaneHead") for l in lanes]
    rows = [header]
    for step in steps:
        row = []
        for lane in lanes:
            cell = step.get(lane, "")
            row.append(P(cell, "Tinyx") if cell else "")
        rows.append(row)
    col_width = (WIDTH - 2 * MARGIN) / len(lanes)
    tbl = Table(rows, colWidths=[col_width] * len(lanes), repeatRows=1, hAlign="LEFT")
    tbl.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), NAVY),
                ("GRID", (0, 0), (-1, -1), 0.45, LINE),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 3),
                ("RIGHTPADDING", (0, 0), (-1, -1), 3),
                ("TOPPADDING", (0, 0), (-1, -1), 3),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, BG]),
            ]
        )
    )
    return tbl


def page_title(story, title, note=None):
    story.append(P(title, "H1x"))
    if note:
        story.append(P(note, "Bodyx"))


def add_steps(story, rows):
    story.append(
        matrix(
            ["#", "Who / file", "What happens exactly", "Transport / state touched"],
            rows,
            widths=[0.38 * inch, 2.2 * inch, 5.8 * inch, 2.25 * inch],
            font="Smallx",
        )
    )


def story():
    s = []
    s.append(P("Veltrix SDE Preparation Guide", "TitleBig"))
    s.append(
        P(
            "Workflow-fixed edition: corrected real-time order-flow diagrams grounded in the current codebase. "
            "This replaces the earlier loose arrow diagrams with numbered, lane-based flows that show what each page, API file, engine worker, Redis channel, DB table, and WebSocket subscriber actually does.",
            "SubTitle",
        )
    )
    s.append(Spacer(1, 0.08 * inch))
    s.append(
        matrix(
            ["Runtime", "Owns", "Important files"],
            [
                ["Web service", "Pages, trading panels, HTTP calls, WebSocket client, Zustand live state.", "app/(exchange) pages, OrderForm, CandleChart, MarketActivityPanel, liveMarketStore, lib/api, lib/websocket"],
                ["API service", "Auth boundary, HTTP validation, wallet/order DB transactions, Redis command publishing.", "orders.routes, order.controller, order.service, order.producer, lib/redis"],
                ["Redis", "Transient pub/sub transport only. It is not the database and it does not talk to browsers directly.", "channels: orders, cancel_orders, trades"],
                ["Engine service", "In-memory orderbooks, matching, event emission, persistence workers, WebSocket server.", "redisConsumer, consumer, MarketManager, Market, MatchingEngine, OrderBook, tradeWorker, orderWorker, wsServer"],
                ["Postgres", "Durable users, orders, balances, trades, candles, payments.", "User, Order, AssetBalance, Trade, Candle, PaymentTopUp"],
            ],
            widths=[1.25 * inch, 4.55 * inch, 4.85 * inch],
        )
    )
    s.append(Spacer(1, 0.14 * inch))
    s.append(P("Correct mental model", "H2x"))
    s.append(flow_row([
        {"title": "Browser pages", "body": "User acts in Spot/Future page", "fill": BLUE},
        {"title": "API", "body": "Validates + writes command state", "via": "HTTP", "fill": GREEN},
        {"title": "Redis", "body": "Carries command/event messages", "via": "publish", "fill": AMBER},
        {"title": "Engine", "body": "Matches + emits internal events", "via": "subscribe", "fill": PURPLE},
        {"title": "DB + WS", "body": "Workers persist; WS broadcasts", "via": "events", "fill": GRAY},
    ]))
    s.append(PageBreak())

    page_title(s, "1. Whole App Order Flow", "This is the full path for a user placing a limit order from the trading screen. The diagram separates command acceptance, matching, persistence, and live UI updates.")
    s.append(flow_row([
        {"title": "1 Page", "body": "spot/[market] or future/[market] renders trading page", "fill": BLUE},
        {"title": "2 Form", "body": "OrderForm builds symbol, price, quantity, side", "via": "component", "fill": BLUE},
        {"title": "3 API client", "body": "placeOrder posts with JWT", "via": "fetch", "fill": BLUE},
        {"title": "4 Express route", "body": "POST /order or /spot/:market/order", "via": "HTTP", "fill": GREEN},
        {"title": "5 Service", "body": "locks funds/assets + creates DB order", "via": "Prisma tx", "fill": GREEN},
    ]))
    s.append(Spacer(1, 0.1 * inch))
    s.append(flow_row([
        {"title": "6 Redis", "body": "API publishes to orders", "fill": AMBER},
        {"title": "7 Engine consumer", "body": "subscribes to orders", "via": "pub/sub", "fill": PURPLE},
        {"title": "8 Matching", "body": "MarketManager + MatchingEngine process order", "via": "memory", "fill": PURPLE},
        {"title": "9 Events", "body": "TRADE_EVENT, ORDER_EVENT, ORDERBOOK_DIFF_EVENT", "via": "eventBus", "fill": PURPLE},
        {"title": "10 Outputs", "body": "DB workers persist; WS broadcasts to pages", "via": "DB/WS", "fill": GRAY},
    ]))
    s.append(Spacer(1, 0.12 * inch))
    add_steps(s, [
        ["1", "web-service/app/(exchange)/spot/[market]/page.tsx or future/[market]/page.tsx", "Reads the route market param and renders SpotTradingPage or FuturesTradingPage.", "Next.js route render"],
        ["2", "SpotTradingPage / FuturesTradingPage", "Composes MarketStatsBar, CandleChart, MarketActivityPanel, and OrderForm. This page does not perform matching or DB work.", "React composition"],
        ["3", "OrderForm", "User enters price/quantity and clicks Buy or Sell. The component builds OrderInput with symbol, price, quantity, side, type='limit'.", "Browser state"],
        ["4", "web-service/lib/api.ts placeOrder", "Chooses the correct endpoint for spot/future, attaches Authorization bearer token, POSTs JSON.", "HTTP fetch"],
        ["5", "api-service/orders/order.routes.ts", "Express route applies authMiddleware, then calls createOrder.", "HTTP route + JWT"],
        ["6", "order.controller.ts createOrder", "Validates request, generates order id, attaches authenticated userId, returns accepted response after service completes.", "Validation + response"],
        ["7", "order.service.ts placeOrderService", "In a DB transaction: buy decrements User.balance and records lockedQuote; sell decrements AssetBalance.free and increments locked; creates Order row with OPEN status.", "Postgres transaction"],
        ["8", "order.producer.ts sendOrderToEngine", "After the DB transaction, publishes the order payload to Redis channel orders.", "Redis publish"],
        ["9", "engine redisConsumer.ts", "Subscribed engine receives orders message, parses JSON, and calls processOrder.", "Redis subscribe"],
        ["10", "engine consumer.ts", "Converts DB string order id to engine numeric id, stores order, and calls marketManager.process.", "Engine memory"],
        ["11", "MarketManager / Market / MatchingEngine", "Gets/creates the symbol market, mutates the in-memory orderbook, matches against opposite side if possible.", "Engine memory"],
        ["12", "eventBus listeners", "Orderbook, order, trade, candle, DB, and WS listeners react to emitted events.", "In-process events"],
    ])
    s.append(PageBreak())

    page_title(s, "2. Trading Page Responsibility Diagram", "These are the actual pages/components that participate when the user is on a market screen.")
    s.append(
        swimlane(
            ["Route page", "Trading page", "Child component", "Store / network", "Visible result"],
            [
                {"Route page": "1. app/(exchange)/spot/[market]/page.tsx awaits params.market.", "Trading page": "2. Renders SpotTradingPage(marketParam).", "Child component": "", "Store / network": "", "Visible result": "Spot market URL loads."},
                {"Route page": "1. app/(exchange)/future/[market]/page.tsx awaits params.market.", "Trading page": "2. Renders FuturesTradingPage(marketParam).", "Child component": "", "Store / network": "", "Visible result": "Future market URL loads."},
                {"Route page": "", "Trading page": "3. setSelectedSymbol updates marketStore from route param.", "Child component": "MarketStatsBar, CandleChart, MarketActivityPanel, OrderForm are mounted.", "Store / network": "marketStore owns selected spot/future symbol.", "Visible result": "Screen points at selected symbol."},
                {"Route page": "", "Trading page": "4. MarketStatsBar can change market.", "Child component": "handleMarketChange updates store and router.pushes next route.", "Store / network": "marketStore + Next router.", "Visible result": "URL and visible market change together."},
                {"Route page": "", "Trading page": "5. CandleChart mounts.", "Child component": "CandleChart subscribes to WS and loads historical candles.", "Store / network": "GET /market/:symbol/candles + WebSocket SUBSCRIBE.", "Visible result": "Chart shows history and live candle updates."},
                {"Route page": "", "Trading page": "6. MarketActivityPanel mounts.", "Child component": "Spot/FuturesOrderBook or Spot/FuturesTrades based on active tab.", "Store / network": "useLiveMarketStore subscribe/unsubscribe ref count.", "Visible result": "Book or trade tape updates live."},
                {"Route page": "", "Trading page": "7. OrderForm mounts.", "Child component": "Builds order from current selected market and user input.", "Store / network": "POST order API, refreshWallet, orders-updated event.", "Visible result": "Toast, wallet refresh, order list refresh trigger."},
            ],
        )
    )
    s.append(PageBreak())

    page_title(s, "3. Limit Order Acceptance Flow", "This flow ends before matching. It answers: who writes the initial order row, who locks money/assets, and when Redis is used.")
    add_steps(s, [
        ["1", "OrderForm", "User clicks Buy or Sell. The form does not touch DB, Redis, engine, or WebSocket.", "Browser only"],
        ["2", "placeOrder in web-service/lib/api.ts", "POSTs JSON to API with token. Spot/future affects endpoint path, not matching behavior.", "HTTP"],
        ["3", "authMiddleware", "Verifies JWT and attaches user to request.", "HTTP auth"],
        ["4", "createOrder controller", "Calls validateOrder, generates id, sets status OPEN in the payload.", "API memory"],
        ["5", "placeOrderService", "Rejects non-limit orders. Computes orderValue = price * quantity.", "Business validation"],
        ["6", "Buy branch", "Updates User where balance >= orderValue, decrementing balance. Order.lockedQuote stores the reserved cash.", "Postgres transaction"],
        ["7", "Sell branch", "Updates AssetBalance where free >= quantity, decrementing free and incrementing locked. Order.lockedBase stores reserved base asset.", "Postgres transaction"],
        ["8", "Order row create", "Creates durable Order with remaining=quantity and status=OPEN.", "Postgres transaction"],
        ["9", "sendOrderToEngine", "Only after DB transaction succeeds, Redis publishes the order to channel orders.", "Redis pub/sub"],
        ["10", "API response", "Browser receives success/orderId/message. This means accepted by API and published attempt completed, not necessarily filled.", "HTTP response"],
    ])
    s.append(Spacer(1, 0.1 * inch))
    s.append(chip("Key correction: Redis does not write this initial order into DB. API order.service writes the DB order, then API publishes the command to Redis.", AMBER))
    s.append(PageBreak())

    page_title(s, "4. Matching Engine Flow: No Match vs Match", "The engine is the only place where orderbook mutation and trade creation happen. API never matches orders.")
    s.append(flow_row([
        {"title": "1 Redis orders", "body": "engine subscribed", "fill": AMBER},
        {"title": "2 processOrder", "body": "convert to engine Order", "via": "message", "fill": PURPLE},
        {"title": "3 MarketManager", "body": "get/create Market by symbol", "via": "call", "fill": PURPLE},
        {"title": "4 MatchingEngine", "body": "compare price against best bid/ask", "via": "memory", "fill": PURPLE},
        {"title": "5 Result", "body": "rest order or emit trades", "via": "mutation", "fill": GRAY},
    ]))
    s.append(Spacer(1, 0.1 * inch))
    s.append(
        swimlane(
            ["Case", "OrderBook action", "Events emitted", "DB effect", "WS effect"],
            [
                {"Case": "1. Buy limit does not cross best ask.", "OrderBook action": "OrderBook.addOrder adds buy order to bid price level.", "Events emitted": "ORDERBOOK_DIFF_EVENT for BUY level, ORDER_EVENT for order.", "DB effect": "orderWorker keeps remaining/status OPEN.", "WS effect": "orderbookStream broadcasts ORDERBOOK_DIFF."},
                {"Case": "2. Sell limit does not cross best bid.", "OrderBook action": "OrderBook.addOrder adds sell order to ask price level.", "Events emitted": "ORDERBOOK_DIFF_EVENT for SELL level, ORDER_EVENT for order.", "DB effect": "orderWorker keeps remaining/status OPEN.", "WS effect": "orderbookStream broadcasts ORDERBOOK_DIFF."},
                {"Case": "3. Buy crosses resting ask.", "OrderBook action": "MatchingEngine pops/updates best ask level and reduces incoming buy remaining.", "Events emitted": "TRADE_EVENT for execution, ORDERBOOK_DIFF_EVENT for consumed ask level, ORDER_EVENT for incoming order.", "DB effect": "tradeWorker persists trade; orderWorker/tradeWorker update statuses and balances.", "WS effect": "tradeStream broadcasts TRADE_UPDATE; candleStream broadcasts CANDLE_UPDATE; orderbookStream broadcasts diff."},
                {"Case": "4. Sell crosses resting bid.", "OrderBook action": "MatchingEngine pops/updates best bid level and reduces incoming sell remaining.", "Events emitted": "TRADE_EVENT, ORDERBOOK_DIFF_EVENT, ORDER_EVENT.", "DB effect": "Trade row created, buyer/seller orders updated, balances/assets settled.", "WS effect": "Trade tape, candles, and book update live."},
                {"Case": "5. Partial fill leaves remainder.", "OrderBook action": "Remaining quantity can rest on book if limit order still has quantity.", "Events emitted": "Trade event(s), diff(s), order event.", "DB effect": "Order status PARTIALLY_FILLED and remaining updated.", "WS effect": "Users see both trade and remaining book level."},
            ],
        )
    )
    s.append(PageBreak())

    page_title(s, "5. Trade Persistence And Balance Settlement", "This is the most important correction: trade persistence is triggered through engine trade events and Redis trades, not by the browser.")
    add_steps(s, [
        ["1", "Market.processOrder", "For every matched Trade in result.trades, emits TRADE_EVENT.", "eventBus"],
        ["2", "events/tradePublisher.ts", "Listens to TRADE_EVENT and publishes the trade to Redis channel trades.", "Redis publish"],
        ["3", "persistence/tradeWorker.ts", "Subscribes to Redis trades and serializes persistence with tradePersistQueue.", "Redis subscribe"],
        ["4", "tradeWorker persistTrade", "Checks if Trade id already exists. If yes, exits to avoid duplicate persistence.", "Postgres read"],
        ["5", "tradeWorker DB transaction", "Creates Trade row, updates buy/sell Order status and remaining, unlocks/refunds quote, credits buyer base asset, decrements seller locked base, credits seller balance.", "Postgres transaction"],
        ["6", "persistence/orderWorker.ts", "Also listens to ORDER_EVENT and updates the incoming order remaining/status when the engine finishes processing.", "eventBus -> Postgres"],
        ["7", "candles/candleStream.ts", "Listens to the same TRADE_EVENT, builds 1m/5m/15m/1h candles, and calls upsertCandle.", "eventBus -> Postgres"],
    ])
    s.append(Spacer(1, 0.1 * inch))
    s.append(chip("Key correction: Engine does push effects into DB, but through workers. orderWorker listens to in-process ORDER_EVENT. tradeWorker listens to Redis trades. candleStream writes candle rows from TRADE_EVENT.", GREEN))
    s.append(PageBreak())

    page_title(s, "6. Real-Time WebSocket Broadcast Flow", "Redis does not broadcast to WebSocket clients. The engine WebSocket server broadcasts from in-process event listeners.")
    add_steps(s, [
        ["1", "CandleChart / SpotOrderBook / SpotTrades", "On mount, each component calls useLiveMarketStore.subscribe(symbol). Multiple components share one socket using ref counts.", "React effect"],
        ["2", "liveMarketStore.subscribe", "If no socket exists for symbol, calls connectWS(symbol).", "Browser store"],
        ["3", "websocket.ts connectWS", "Opens WebSocket to NEXT_PUBLIC_WS_URL or ws://localhost:8080.", "WebSocket connect"],
        ["4", "websocket.ts onopen", "Sends { type: 'SUBSCRIBE', symbol }.", "WebSocket message"],
        ["5", "engine wsServer.ts", "Adds socket to clients map under that symbol.", "Engine memory"],
        ["6", "wsServer.ts initial sends", "Immediately sends ORDERBOOK_SNAPSHOT, CANDLE_SNAPSHOT, and TRADE_SNAPSHOT.", "WebSocket send"],
        ["7", "orderbookStream.ts", "On ORDERBOOK_DIFF_EVENT, updates snapshot cache, increments sequence, broadcasts ORDERBOOK_DIFF.", "eventBus -> WS"],
        ["8", "tradeStream.ts", "On TRADE_EVENT, updates recent trade cache and broadcasts TRADE_UPDATE.", "eventBus -> WS"],
        ["9", "candleStream.ts", "On TRADE_EVENT, updates candle and broadcasts CANDLE_UPDATE.", "eventBus -> WS"],
        ["10", "liveMarketStore onmessage", "Merges snapshot/diff/trade/candle messages into Zustand state.", "Browser memory"],
        ["11", "UI components", "Orderbook, trade tape, chart, stats read store state and rerender.", "React render"],
    ])
    s.append(PageBreak())

    page_title(s, "7. Orderbook Snapshot And Diff Flow", "This diagram shows why new clients receive a snapshot first, then diffs.")
    s.append(
        swimlane(
            ["Engine event source", "Snapshot/cache layer", "WS server", "Browser store", "UI"],
            [
                {"Engine event source": "1. OrderBook.addOrder / popBestBid / popBestAsk / removeOrder mutates a price level.", "Snapshot/cache layer": "", "WS server": "", "Browser store": "", "UI": ""},
                {"Engine event source": "2. OrderBook.emitLevelUpdate emits ORDERBOOK_DIFF_EVENT with symbol, side, price, quantity.", "Snapshot/cache layer": "", "WS server": "", "Browser store": "", "UI": ""},
                {"Engine event source": "", "Snapshot/cache layer": "3. orderbookStream gets snapshot for symbol and nextSeq(symbol).", "WS server": "", "Browser store": "", "UI": ""},
                {"Engine event source": "", "Snapshot/cache layer": "4. It deletes the price if quantity is 0, otherwise sets price -> quantity.", "WS server": "", "Browser store": "", "UI": ""},
                {"Engine event source": "", "Snapshot/cache layer": "", "WS server": "5. broadcast(symbol, ORDERBOOK_DIFF) sends only to sockets subscribed to that symbol.", "Browser store": "", "UI": ""},
                {"Engine event source": "", "Snapshot/cache layer": "", "WS server": "", "Browser store": "6. liveMarketStore receives ORDERBOOK_DIFF and updates bids/asks map-like arrays.", "UI": ""},
                {"Engine event source": "", "Snapshot/cache layer": "", "WS server": "", "Browser store": "", "UI": "7. SpotOrderBook/FuturesOrderBook sort top asks/bids and render."},
                {"Engine event source": "", "Snapshot/cache layer": "New connection path: wsServer reads current snapshot cache.", "WS server": "Sends ORDERBOOK_SNAPSHOT with current seq before future diffs.", "Browser store": "Replaces local bids/asks with snapshot.", "UI": "Fresh tab starts from full book state."},
            ],
        )
    )
    s.append(PageBreak())

    page_title(s, "8. Cancel Order Flow", "Cancel has two phases: API durable cancel/refund, then Redis command to remove from engine memory.")
    add_steps(s, [
        ["1", "Frontend caller", "Calls cancelOrder(token, orderId) from web-service/lib/api.ts. The order-list UI can refresh after event veltrix:orders-updated.", "HTTP DELETE"],
        ["2", "api-service/orders/order.routes.ts", "DELETE /order/:orderId applies authMiddleware and calls cancelOrder controller.", "HTTP route"],
        ["3", "cancelOrderService", "Finds order, verifies it belongs to user, requires OPEN or PARTIALLY_FILLED.", "Postgres read"],
        ["4", "cancelOrderService transaction", "Sets status=CANCELLED, clears lockedQuote/lockedBase, refunds quote for buy or base asset for sell.", "Postgres transaction"],
        ["5", "order.controller.ts", "After DB cancel succeeds, publishes { orderId, symbol, userId } to Redis cancel_orders.", "Redis publish"],
        ["6", "engine redisConsumer.ts", "Subscribed to cancel_orders, parses payload, calls marketManager.cancel(symbol, engineOrderId).", "Redis subscribe"],
        ["7", "Market / OrderBook", "removeOrder locates orderIndex entry, removes it from price level, emits ORDERBOOK_DIFF_EVENT with new level quantity or 0.", "Engine memory"],
        ["8", "orderbookStream.ts", "Broadcasts ORDERBOOK_DIFF to subscribed browsers.", "WebSocket"],
        ["9", "Important race", "If engine already matched the order before cancel arrives, cancel may miss the orderbook entry; DB state must reflect current fill/cancel race safely.", "Consistency concern"],
    ])
    s.append(PageBreak())

    page_title(s, "9. Candle And Chart Flow", "Candles are not created by resting orders. Candles are derived only from executed trades.")
    add_steps(s, [
        ["1", "CandleChart", "On mount, subscribes to live WS and calls loadCandles(symbol, interval).", "React effect"],
        ["2", "liveMarketStore.loadCandles", "Calls getMarketCandles(symbol, interval, 500).", "Browser store"],
        ["3", "web-service/lib/api.ts", "GET /market/:symbol/candles?interval=...&limit=500.", "HTTP fetch"],
        ["4", "API market controller", "Reads Candle table and returns historical candles.", "Postgres read"],
        ["5", "CandleChart", "Filters selected interval and draws candlesticks/volume with lightweight-charts.", "Browser render"],
        ["6", "Engine matching", "A trade occurs and Market emits TRADE_EVENT.", "eventBus"],
        ["7", "candleStream.ts", "For 1m, 5m, 15m, 1h: updateCandleFromTrade builds/updates OHLCV candle.", "Engine memory"],
        ["8", "candleStream.ts", "Calls upsertCandle(candle) in background.", "Postgres write"],
        ["9", "candleStream.ts", "Broadcasts CANDLE_UPDATE for each interval.", "WebSocket"],
        ["10", "liveMarketStore", "Merges incoming candle by interval and bucket, keeps recent window.", "Browser memory"],
        ["11", "CandleChart", "Rerenders chart with latest candle data.", "Browser render"],
    ])
    s.append(PageBreak())

    page_title(s, "10. Publisher And Subscriber Matrix", "This page answers exactly who publishes and who subscribes.")
    s.append(
        matrix(
            ["Channel / event", "Publisher", "Subscriber", "Purpose", "Does it write DB?", "Does it broadcast WS?"],
            [
                ["Redis orders", "API order.producer after order DB transaction", "Engine redisConsumer", "Tell engine to process a newly accepted order.", "No, API already wrote initial order. Engine later may update DB through events.", "No direct WS. Engine matching events later broadcast."],
                ["Redis cancel_orders", "API order.controller after cancel DB transaction", "Engine redisConsumer", "Tell engine to remove cancelled order from in-memory orderbook.", "No, API already cancelled/refunded DB state.", "No direct WS. OrderBook diff event later broadcasts."],
                ["Redis trades", "Engine tradePublisher listens to TRADE_EVENT", "Engine tradeWorker", "Make trade persistence happen through a Redis message.", "Yes, tradeWorker writes Trade, Order, User, AssetBalance.", "No direct WS. tradeStream listens to TRADE_EVENT separately."],
                ["TRADE_EVENT", "Market.processOrder when MatchingEngine creates trades", "tradePublisher, tradeStream, candleStream", "Fan out matched executions inside engine process.", "Indirectly: tradePublisher -> Redis trades -> tradeWorker; candleStream upserts Candle.", "Yes: tradeStream sends TRADE_UPDATE; candleStream sends CANDLE_UPDATE."],
                ["ORDER_EVENT", "Market.processOrder after processing incoming order", "orderWorker", "Update incoming order remaining/status.", "Yes, orderWorker updates Order.", "No direct WS."],
                ["ORDERBOOK_DIFF_EVENT", "OrderBook after add/remove/match changes a price level", "orderbookStream", "Update snapshot cache and send book diff.", "No.", "Yes: ORDERBOOK_DIFF."],
                ["Browser SUBSCRIBE", "websocket.ts onopen", "engine wsServer", "Register browser under symbol.", "No.", "wsServer replies with snapshots."],
            ],
            widths=[1.25 * inch, 1.75 * inch, 1.7 * inch, 2.35 * inch, 1.8 * inch, 1.8 * inch],
            font="Tinyx",
        )
    )
    s.append(PageBreak())

    page_title(s, "11. State Ownership Map", "Use this to avoid confusing DB state, Redis messages, engine memory, and browser state.")
    s.append(
        matrix(
            ["State", "Owner", "How created / updated", "Who reads it", "Reset behavior"],
            [
                ["User.balance", "Postgres User table", "Order acceptance locks quote; tradeWorker credits seller/refunds buyer; payments credit wallet.", "Wallet API, order service, tradeWorker.", "Persists until DB reset/migration."],
                ["AssetBalance.free/locked", "Postgres AssetBalance table", "Sell orders lock base; tradeWorker transfers base to buyer and reduces seller locked; cancel refunds.", "Wallet/API/order service/tradeWorker.", "Persists until DB reset."],
                ["Order rows", "Postgres Order table", "API creates; cancel service cancels; orderWorker/tradeWorker update remaining/status.", "Activity API, recovery loadOpenOrders.", "Persists until DB reset."],
                ["Trade rows", "Postgres Trade table", "tradeWorker consumes Redis trades and creates rows idempotently.", "Activity API/history, market stats if used.", "Persists until DB reset."],
                ["Candle rows", "Postgres Candle table", "candleStream upserts from executed trades.", "Market candle API.", "Persists until DB reset."],
                ["OrderBook", "Engine process memory", "MatchingEngine/OrderBook mutate it from Redis orders/cancels and recovery.", "orderbookStream/snapshot rebuild.", "Lost on engine restart, rebuilt from open DB orders."],
                ["Snapshot cache / seq", "Engine process memory", "orderbookStream and snapshot rebuild maintain it.", "wsServer sends snapshots/diffs.", "Lost on engine restart, rebuilt from open orders."],
                ["Recent trade cache", "Engine process memory", "tradeStream addRecentTrade from TRADE_EVENT.", "wsServer TRADE_SNAPSHOT.", "Lost on engine restart unless rebuilt separately."],
                ["Zustand live store", "Browser memory", "WebSocket snapshots/diffs and candle HTTP merge into it.", "React components.", "Lost on refresh, rebuilt from HTTP + WS snapshots."],
                ["Redis pub/sub messages", "Redis transport", "Published by API/engine; delivered only to active subscribers.", "Engine consumers/workers.", "Not durable in pub/sub; offline subscriber misses messages."],
            ],
            widths=[1.45 * inch, 1.75 * inch, 3.15 * inch, 2.05 * inch, 2.25 * inch],
            font="Tinyx",
        )
    )
    s.append(PageBreak())

    page_title(s, "12. Engine Startup And Recovery Flow", "This is what happens after the engine process starts or restarts.")
    add_steps(s, [
        ["1", "engine-service/index.ts imports", "Imports tradePublisher, candleStream, wsServer, orderbookStream, tradeStream. These imports register event listeners and start the WS server.", "Module startup"],
        ["2", "startConsumer()", "Connects Redis subscriber and subscribes to orders and cancel_orders.", "Redis subscribe"],
        ["3", "startTradeWorker()", "Connects Redis subscriber and subscribes to trades.", "Redis subscribe"],
        ["4", "startOrderWorker()", "Registers ORDER_EVENT listener for DB order updates.", "eventBus listener"],
        ["5", "loadOpenOrders()", "Reads open/partially-filled orders from DB.", "Postgres read"],
        ["6", "rebuildLocks(orders)", "Rebuilds lock-related memory from open orders where applicable.", "Engine memory"],
        ["7", "rebuildEngine(marketManager)", "Adds open orders back into the in-memory matching books.", "Engine memory"],
        ["8", "rebuildSnapshots()", "Recreates WebSocket orderbook snapshots from rebuilt books.", "Engine memory"],
        ["9", "Engine ready", "New clients connecting to WS receive fresh snapshots; Redis commands can now be consumed.", "Runtime ready"],
    ])
    s.append(PageBreak())

    page_title(s, "13. Debugging Playbooks With Real Boundaries", "Follow these in order. Each step tells you where the truth should be at that moment.")
    s.append(
        matrix(
            ["Symptom", "Check in order", "What each result means"],
            [
                ["Order accepted in UI but not in book", "1 browser network POST, 2 API response, 3 Order row, 4 Redis publish log, 5 engine redisConsumer log, 6 MarketManager book, 7 ORDERBOOK_DIFF WS.", "If DB row exists but engine never logs it, Redis/engine consumer is the boundary. If engine has it but UI does not, WS subscription/store is the boundary."],
                ["Trade tape empty but book has levels", "1 Were two crossing orders placed? 2 Matching result trades. 3 TRADE_EVENT logs/listeners. 4 tradeStream WS. 5 liveMarketStore trades.", "Resting liquidity alone does not create trades. Trade tape updates only after an execution."],
                ["Chart blank", "1 Candle API response, 2 Candle table, 3 Was there any executed trade? 4 candleStream logs, 5 CANDLE_UPDATE WS.", "No trades means no candles. Blank chart after reset is expected until matching creates trades."],
                ["Balance wrong", "1 User.balance, 2 AssetBalance free/locked, 3 open orders lockedQuote/lockedBase, 4 Trade rows, 5 tradeWorker errors, 6 cancel/refund path.", "Balance is DB-owned. Frontend should refresh wallet; it should not calculate final balances itself."],
                ["Cancel says success but book still shows order", "1 DB order status CANCELLED, 2 cancel_orders publish, 3 engine cancel log, 4 orderId conversion, 5 ORDERBOOK_DIFF WS.", "If DB cancelled but engine missed, order may have already matched or numeric id conversion/orderIndex did not locate it."],
                ["Old book after DB reset", "1 Engine process still running? 2 snapshot cache still in memory? 3 browser socket still connected?", "DB reset does not clear engine memory. Restart engine to clear/rebuild books."],
            ],
            widths=[1.55 * inch, 4.15 * inch, 4.95 * inch],
            font="Smallx",
        )
    )
    s.append(PageBreak())

    page_title(s, "14. Interview-Ready Summary Diagram", "One compact version you can speak in an interview.")
    s.append(flow_row([
        {"title": "1 User", "body": "places limit order in OrderForm", "fill": BLUE},
        {"title": "2 Web", "body": "POSTs through lib/api with JWT", "via": "fetch", "fill": BLUE},
        {"title": "3 API", "body": "auth, validate, lock funds/assets, create Order", "via": "HTTP", "fill": GREEN},
        {"title": "4 Redis", "body": "orders command for engine", "via": "publish", "fill": AMBER},
        {"title": "5 Engine", "body": "consume, convert, match in memory", "via": "subscribe", "fill": PURPLE},
    ]))
    s.append(Spacer(1, 0.1 * inch))
    s.append(flow_row([
        {"title": "6 Events", "body": "trade/order/book/candle events", "fill": PURPLE},
        {"title": "7 Persistence", "body": "Order, Trade, balances, candles", "via": "workers", "fill": GREEN},
        {"title": "8 WS", "body": "snapshots + diffs + trades + candles", "via": "broadcast", "fill": BLUE},
        {"title": "9 Store", "body": "liveMarketStore merges messages", "via": "onmessage", "fill": BLUE},
        {"title": "10 UI", "body": "book, trades, chart rerender", "via": "React", "fill": GRAY},
    ]))
    s.append(Spacer(1, 0.16 * inch))
    s.append(P("Plain answer to the earlier confusion:", "H2x"))
    s.append(
        matrix(
            ["Question", "Correct answer"],
            [
                ["Does Redis pub/sub push into DB?", "No. Redis only delivers messages. Your subscribers such as tradeWorker decide to write to DB."],
                ["Does Redis broadcast into WebSocket?", "No. Engine wsServer broadcasts to WebSocket clients. Redis does not know browser sockets."],
                ["Does engine push into DB?", "Yes, through orderWorker, tradeWorker, and candleStream persistence paths."],
                ["Does engine push into WebSocket?", "Yes, through orderbookStream, tradeStream, candleStream, and wsServer.broadcast."],
                ["Who is publisher?", "API publishes orders/cancel_orders. Engine publishes trades to Redis and emits in-process events."],
                ["Who is subscriber?", "Engine redisConsumer subscribes to orders/cancel_orders. Engine tradeWorker subscribes to trades. Browser subscribes to engine WebSocket by symbol."],
            ],
            widths=[3.1 * inch, 7.55 * inch],
        )
    )
    return s


def main():
    doc = BaseDocTemplate(
        str(OUT),
        pagesize=PAGE,
        rightMargin=MARGIN,
        leftMargin=MARGIN,
        topMargin=0.38 * inch,
        bottomMargin=0.48 * inch,
        title="Veltrix SDE Preparation Guide",
        author="Codex",
    )
    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="normal")
    doc.addPageTemplates([PageTemplate(id="page", frames=[frame], onPage=footer)])
    doc.build(story())


if __name__ == "__main__":
    main()
