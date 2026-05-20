from __future__ import annotations

import math
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas


OUT = Path(r"C:\Users\DEV\Desktop\veltrix-sde-preparation-guide.pdf")
PAGE = landscape(A4)
W, H = PAGE

INK = colors.HexColor("#1f2937")
MUTED = colors.HexColor("#596575")
GRID = colors.HexColor("#d8dee8")
PAPER = colors.HexColor("#fbfbf8")
BLUE = colors.HexColor("#dcecff")
GREEN = colors.HexColor("#dcf7e8")
YELLOW = colors.HexColor("#fff1c7")
PURPLE = colors.HexColor("#eee3ff")
RED = colors.HexColor("#ffe2df")
GRAY = colors.HexColor("#eef2f6")


def wrap_text(text: str, max_chars: int) -> list[str]:
    words = text.split()
    lines: list[str] = []
    line = ""
    for word in words:
        next_line = f"{line} {word}".strip()
        if len(next_line) > max_chars and line:
            lines.append(line)
            line = word
        else:
            line = next_line
    if line:
        lines.append(line)
    return lines


class Sketch:
    def __init__(self, path: Path):
        self.c = canvas.Canvas(str(path), pagesize=PAGE)
        self.page = 0

    def begin(self, title: str, subtitle: str = ""):
        self.page += 1
        c = self.c
        c.setFillColor(PAPER)
        c.rect(0, 0, W, H, fill=1, stroke=0)
        c.setStrokeColor(colors.HexColor("#edf0f4"))
        c.setLineWidth(0.35)
        step = 24
        x = 0
        while x <= W:
            c.line(x, 0, x, H)
            x += step
        y = 0
        while y <= H:
            c.line(0, y, W, y)
            y += step
        c.setFillColor(INK)
        c.setFont("Helvetica-Bold", 19)
        c.drawString(34, H - 34, title)
        if subtitle:
            c.setFont("Helvetica", 8.7)
            c.setFillColor(MUTED)
            c.drawString(35, H - 49, subtitle)
        c.setFont("Helvetica", 7)
        c.setFillColor(MUTED)
        c.drawRightString(W - 30, 18, f"Veltrix workflow map | page {self.page}")

    def finish_page(self):
        self.c.showPage()

    def save(self):
        self.c.save()

    def node(self, x, y, w, h, title, body="", fill=GRAY, shape="round"):
        c = self.c
        c.setFillColor(fill)
        c.setStrokeColor(INK)
        c.setLineWidth(1.25)
        if shape == "circle":
            c.ellipse(x - w / 2, y - h / 2, x + w / 2, y + h / 2, fill=1, stroke=1)
            c.setStrokeColor(colors.HexColor("#657080"))
            c.ellipse(x - w / 2 + 2, y - h / 2 - 1, x + w / 2 + 2, y + h / 2 - 1, fill=0, stroke=1)
            tx, ty = x, y + 8
            align = "center"
            max_chars = max(8, int(w / 5.5))
        else:
            c.roundRect(x - w / 2, y - h / 2, w, h, 9, fill=1, stroke=1)
            c.setStrokeColor(colors.HexColor("#657080"))
            c.roundRect(x - w / 2 + 2, y - h / 2 - 2, w, h, 9, fill=0, stroke=1)
            tx, ty = x, y + h / 2 - 16
            align = "center"
            max_chars = max(10, int(w / 5.1))
        c.setFillColor(INK)
        c.setFont("Helvetica-Bold", 9.5)
        for i, line in enumerate(wrap_text(title, max_chars)[:2]):
            if align == "center":
                c.drawCentredString(tx, ty - i * 10, line)
            else:
                c.drawString(tx, ty - i * 10, line)
        if body:
            c.setFont("Helvetica", 6.7)
            c.setFillColor(colors.HexColor("#344054"))
            body_lines = wrap_text(body, max_chars + 4)[:4]
            base = y - 5 if shape == "circle" else y + h / 2 - 38
            for i, line in enumerate(body_lines):
                c.drawCentredString(x, base - i * 8, line)

    def note(self, x, y, w, h, title, lines, fill=colors.white):
        c = self.c
        c.setFillColor(fill)
        c.setStrokeColor(INK)
        c.setLineWidth(1)
        c.rect(x, y, w, h, fill=1, stroke=1)
        c.setFont("Helvetica-Bold", 9)
        c.setFillColor(INK)
        c.drawString(x + 8, y + h - 14, title)
        c.setFont("Helvetica", 7)
        c.setFillColor(colors.HexColor("#344054"))
        yy = y + h - 28
        for line in lines:
            for part in wrap_text(line, int(w / 4.6)):
                c.drawString(x + 9, yy, part)
                yy -= 8.5

    def card(self, x, y, w, h, title, lines, fill=colors.white, title_size=8.2, body_size=6.2):
        c = self.c
        c.setFillColor(fill)
        c.setStrokeColor(INK)
        c.setLineWidth(0.9)
        c.roundRect(x, y, w, h, 7, fill=1, stroke=1)
        c.setFillColor(INK)
        c.setFont("Helvetica-Bold", title_size)
        c.drawString(x + 6, y + h - 12, title)
        c.setFont("Helvetica", body_size)
        c.setFillColor(colors.HexColor("#344054"))
        yy = y + h - 23
        for line in lines:
            for part in wrap_text(line, max(12, int(w / 4.1))):
                if yy < y + 5:
                    return
                c.drawString(x + 6, yy, part)
                yy -= body_size + 1.9

    def card_grid(self, cards, x=34, y=405, cols=3, w=250, h=86, gap_x=16, gap_y=12):
        for i, (title, lines, fill) in enumerate(cards):
            col = i % cols
            row = i // cols
            self.card(x + col * (w + gap_x), y - row * (h + gap_y), w, h, title, lines, fill)

    def arrow(self, x1, y1, x2, y2, label="", num="", curve=0, dashed=False):
        c = self.c
        c.setStrokeColor(INK)
        c.setFillColor(INK)
        c.setLineWidth(1.35)
        if dashed:
            c.setDash(5, 3)
        else:
            c.setDash()
        if curve:
            mx = (x1 + x2) / 2
            my = (y1 + y2) / 2
            dx = x2 - x1
            dy = y2 - y1
            length = max(math.hypot(dx, dy), 1)
            nx = -dy / length
            ny = dx / length
            cx = mx + nx * curve
            cy = my + ny * curve
            c.bezier(x1, y1, cx, cy, cx, cy, x2, y2)
            angle = math.atan2(y2 - cy, x2 - cx)
            lx, ly = cx, cy
        else:
            c.line(x1, y1, x2, y2)
            angle = math.atan2(y2 - y1, x2 - x1)
            lx, ly = (x1 + x2) / 2, (y1 + y2) / 2
        self._arrow_head(x2, y2, angle)
        c.setDash()
        if num:
            c.setFillColor(colors.white)
            c.circle(lx - 13, ly + 9, 8, fill=1, stroke=0)
            c.setStrokeColor(INK)
            c.circle(lx - 13, ly + 9, 8, fill=0, stroke=1)
            c.setFillColor(INK)
            c.setFont("Helvetica-Bold", 7)
            c.drawCentredString(lx - 13, ly + 6.5, num)
        if label:
            c.setFillColor(INK)
            c.setFont("Helvetica", 6.7)
            for i, line in enumerate(wrap_text(label, 24)[:2]):
                c.drawCentredString(lx + 5, ly - 4 - i * 8, line)

    def _arrow_head(self, x, y, angle):
        c = self.c
        size = 7
        a1 = angle + math.pi * 0.82
        a2 = angle - math.pi * 0.82
        p1 = (x + math.cos(a1) * size, y + math.sin(a1) * size)
        p2 = (x + math.cos(a2) * size, y + math.sin(a2) * size)
        c.line(x, y, p1[0], p1[1])
        c.line(x, y, p2[0], p2[1])

    def step_list(self, x, y, title, items, width=300):
        c = self.c
        c.setFont("Helvetica-Bold", 10)
        c.setFillColor(INK)
        c.drawString(x, y, title)
        yy = y - 15
        c.setFont("Helvetica", 7.2)
        for item in items:
            for j, line in enumerate(wrap_text(item, int(width / 4.3))):
                c.drawString(x, yy, line if j else line)
                yy -= 8.5
            yy -= 2


def page_whole_app(sk: Sketch):
    sk.begin("1. Whole App Order Flow", "Visual map like your sketch: each numbered arrow is an actual runtime handoff.")
    sk.node(88, 318, 92, 58, "Browser page", "Spot/Future market screen", BLUE)
    sk.node(220, 318, 82, 55, "API", "Express routes + service", GREEN, "circle")
    sk.node(375, 425, 88, 58, "DB", "Postgres source of truth", GRAY, "circle")
    sk.node(395, 318, 82, 55, "Redis", "pub/sub transport only", YELLOW, "circle")
    sk.node(560, 318, 126, 58, "Engine runtime", "consumer + matching + events", PURPLE)
    sk.node(390, 172, 82, 52, "WS", "engine wsServer", BLUE, "circle")
    sk.node(110, 150, 150, 54, "Render on display", "Zustand store updates chart, book, trades", BLUE)
    sk.arrow(134, 318, 180, 318, "POST order", "1")
    sk.arrow(238, 348, 345, 410, "DB tx", "2", curve=20)
    sk.arrow(262, 318, 353, 318, "publish orders", "3")
    sk.arrow(437, 318, 497, 318, "subscribe orders", "4")
    sk.arrow(552, 348, 422, 414, "persist results", "5", curve=24)
    sk.arrow(525, 290, 425, 185, "WS broadcast", "6", curve=-22)
    sk.arrow(350, 172, 178, 152, "merge store", "7", curve=-18)
    sk.arrow(112, 180, 86, 286, "React render", "8", curve=-18)
    sk.note(635, 250, 180, 142, "Read this diagram", [
        "1 Browser does HTTP only.",
        "2 API writes initial DB order.",
        "3 Redis carries command to engine.",
        "4 Engine matches in memory.",
        "5 Workers persist result.",
        "6 Engine WS server sends live data.",
        "Redis never talks to browser directly.",
    ], colors.white)
    sk.finish_page()


def page_order_acceptance(sk: Sketch):
    sk.begin("2. Limit Order Acceptance: Page To API To Redis", "This diagram stops at command delivery. Matching starts on the next page.")
    sk.node(65, 380, 105, 50, "Route page", "spot/[market] or future/[market]", BLUE)
    sk.node(190, 380, 112, 52, "Trading page", "SpotTradingPage / FuturesTradingPage", BLUE)
    sk.node(320, 380, 105, 52, "OrderForm", "builds price, qty, side", BLUE)
    sk.node(455, 380, 105, 52, "lib/api", "placeOrder() fetch", BLUE)
    sk.node(600, 380, 120, 52, "order.routes", "POST /order + auth", GREEN)
    sk.node(735, 380, 105, 52, "controller", "validate + id + user", GREEN)
    sk.arrow(118, 380, 134, 380, "renders", "1")
    sk.arrow(246, 380, 268, 380, "mounts", "2")
    sk.arrow(373, 380, 402, 380, "submit", "3")
    sk.arrow(508, 380, 540, 380, "HTTP", "4")
    sk.arrow(660, 380, 681, 380, "calls", "5")

    sk.node(240, 220, 145, 62, "placeOrderService", "business rules + transaction", GREEN)
    sk.node(420, 220, 105, 58, "DB", "Order row + locked funds", GRAY, "circle")
    sk.node(595, 220, 100, 55, "Redis", "orders channel", YELLOW, "circle")
    sk.node(735, 220, 120, 52, "HTTP response", "success, orderId, message", BLUE)
    sk.arrow(720, 352, 300, 250, "call service", "6", curve=-40)
    sk.arrow(315, 220, 366, 220, "Prisma tx", "7")
    sk.arrow(472, 220, 542, 220, "publish after commit", "8")
    sk.arrow(640, 220, 680, 220, "return", "9")
    sk.note(40, 70, 345, 98, "What API actually does", [
        "Buy: decrement User.balance, create Order.lockedQuote.",
        "Sell: decrement AssetBalance.free, increment locked, create Order.lockedBase.",
        "Then publish to Redis orders. Redis does not create the DB row.",
    ], colors.white)
    sk.note(430, 70, 355, 98, "What browser actually knows", [
        "The response means the API accepted and published the command.",
        "A later WebSocket update shows whether the order rested, filled, or changed the market.",
    ], colors.white)
    sk.finish_page()


def page_engine_matching(sk: Sketch):
    sk.begin("3. Engine Matching Flow", "The engine consumes Redis commands, mutates in-memory orderbooks, then emits events.")
    sk.node(70, 315, 92, 55, "Redis", "orders channel", YELLOW, "circle")
    sk.node(205, 315, 120, 55, "redisConsumer", "subscribes to orders", PURPLE)
    sk.node(345, 315, 112, 55, "consumer.ts", "toEngineOrder()", PURPLE)
    sk.node(490, 315, 122, 55, "MarketManager", "get/create symbol market", PURPLE)
    sk.node(645, 315, 122, 55, "MatchingEngine", "match by price-time", PURPLE)
    sk.node(645, 170, 122, 55, "OrderBook", "RBTree levels + FIFO queues", PURPLE)
    sk.node(455, 170, 122, 52, "No match", "resting order added", GREEN)
    sk.node(775, 170, 122, 52, "Match", "trade(s) created", RED)
    sk.arrow(116, 315, 145, 315, "message", "1")
    sk.arrow(265, 315, 290, 315, "parse", "2")
    sk.arrow(402, 315, 430, 315, "process", "3")
    sk.arrow(552, 315, 585, 315, "market.process", "4")
    sk.arrow(645, 287, 645, 200, "mutate levels", "5")
    sk.arrow(600, 185, 520, 185, "if no crossing", "6", curve=-8)
    sk.arrow(690, 185, 735, 185, "if crossing", "7", curve=8)
    sk.node(350, 70, 145, 50, "ORDERBOOK_DIFF_EVENT", "level changed", BLUE)
    sk.node(535, 70, 125, 50, "ORDER_EVENT", "order remaining/status", BLUE)
    sk.node(715, 70, 125, 50, "TRADE_EVENT", "execution payload", BLUE)
    sk.arrow(455, 145, 385, 95, "emit diff", "8", curve=10)
    sk.arrow(645, 145, 385, 95, "emit diff", "9", curve=-20)
    sk.arrow(645, 145, 535, 95, "emit order", "10")
    sk.arrow(775, 145, 715, 95, "emit trade", "11")
    sk.note(35, 65, 260, 92, "Important", [
        "API never matches.",
        "DB never decides best bid/ask.",
        "Redis does not run matching.",
        "Matching state is engine process memory."
    ], colors.white)
    sk.finish_page()


def page_trade_outputs(sk: Sketch):
    sk.begin("4. After A Trade: DB Persistence And Live Broadcast", "One TRADE_EVENT fans out to several real actions.")
    sk.node(410, 370, 120, 56, "TRADE_EVENT", "emitted by Market.processOrder", RED, "circle")
    sk.node(150, 280, 132, 54, "tradePublisher", "publish trade to Redis trades", YELLOW)
    sk.node(315, 205, 126, 54, "tradeWorker", "subscribe trades + persist", GREEN)
    sk.node(315, 105, 115, 54, "DB", "Trade, Order, balances", GRAY, "circle")
    sk.node(585, 280, 126, 54, "tradeStream", "recent trade + TRADE_UPDATE", BLUE)
    sk.node(720, 205, 118, 54, "Browser WS", "trade tape updates", BLUE)
    sk.node(585, 150, 126, 54, "candleStream", "build OHLCV + CANDLE_UPDATE", GREEN)
    sk.node(720, 80, 118, 54, "Chart", "candles rerender", BLUE)
    sk.node(410, 260, 126, 54, "orderWorker", "ORDER_EVENT updates order", GREEN)
    sk.arrow(372, 350, 208, 302, "listener", "1", curve=-12)
    sk.arrow(190, 255, 270, 220, "Redis trades", "2", curve=-12)
    sk.arrow(315, 178, 315, 132, "Prisma tx", "3")
    sk.arrow(450, 350, 545, 302, "listener", "4", curve=12)
    sk.arrow(635, 260, 690, 225, "WS send", "5")
    sk.arrow(430, 345, 552, 174, "listener", "6", curve=-28)
    sk.arrow(628, 128, 690, 95, "WS + store", "7")
    sk.arrow(410, 342, 410, 289, "ORDER_EVENT separate path", "8")
    sk.arrow(386, 238, 340, 132, "DB order update", "9", curve=10)
    sk.note(35, 60, 225, 116, "What is durable?", [
        "tradeWorker writes Trade rows.",
        "It updates buy/sell orders.",
        "It moves buyer/seller balances/assets.",
        "candleStream also upserts Candle rows.",
    ], colors.white)
    sk.note(535, 365, 265, 82, "Correction", [
        "Redis trades exists for persistence.",
        "WebSocket updates do not come from Redis directly.",
        "They come from engine event listeners + wsServer.broadcast."
    ], colors.white)
    sk.finish_page()


def page_ws(sk: Sketch):
    sk.begin("5. WebSocket Subscription And Live UI Flow", "Browser subscribes by symbol; engine sends snapshots first, then updates.")
    sk.node(75, 335, 118, 54, "CandleChart", "subscribe(symbol)", BLUE)
    sk.node(75, 245, 118, 54, "OrderBook tab", "subscribe(symbol)", BLUE)
    sk.node(75, 155, 118, 54, "Trades tab", "subscribe(symbol)", BLUE)
    sk.node(245, 245, 135, 60, "liveMarketStore", "one socket per symbol + ref count", BLUE)
    sk.node(420, 245, 122, 55, "websocket.ts", "open WS + send SUBSCRIBE", BLUE)
    sk.node(590, 245, 122, 55, "wsServer", "clients map by symbol", PURPLE)
    sk.node(740, 335, 112, 52, "Snapshots", "book, candles, trades", GREEN)
    sk.node(740, 155, 112, 52, "Updates", "diff, trade, candle", GREEN)
    sk.arrow(134, 335, 188, 268, "mount", "1", curve=-14)
    sk.arrow(134, 245, 178, 245, "mount", "2")
    sk.arrow(134, 155, 188, 220, "mount", "3", curve=14)
    sk.arrow(312, 245, 360, 245, "connectWS", "4")
    sk.arrow(481, 245, 529, 245, "{SUBSCRIBE,symbol}", "5")
    sk.arrow(642, 266, 695, 320, "send immediately", "6", curve=12)
    sk.arrow(642, 224, 695, 170, "broadcast later", "7", curve=-12)
    sk.arrow(700, 335, 320, 280, "onmessage merge", "8", curve=28)
    sk.arrow(700, 155, 320, 210, "onmessage merge", "9", curve=-28)
    sk.note(340, 60, 320, 92, "Message types merged in store", [
        "ORDERBOOK_SNAPSHOT replaces bids/asks.",
        "ORDERBOOK_DIFF changes one price level.",
        "TRADE_UPDATE prepends trade tape item.",
        "CANDLE_UPDATE merges by interval + bucket.",
    ], colors.white)
    sk.finish_page()


def page_cancel(sk: Sketch):
    sk.begin("6. Cancel Order Flow", "Cancel is DB-first in API, then Redis tells engine to remove from in-memory book.")
    sk.node(85, 330, 125, 54, "Open orders UI", "cancelOrder(token,id)", BLUE)
    sk.node(245, 330, 120, 54, "API route", "DELETE /order/:id", GREEN)
    sk.node(405, 330, 132, 54, "cancel service", "verify owner + open status", GREEN)
    sk.node(570, 330, 105, 54, "DB", "status CANCELLED + refund", GRAY, "circle")
    sk.node(405, 205, 110, 54, "Redis", "cancel_orders", YELLOW, "circle")
    sk.node(570, 205, 130, 54, "engine consumer", "marketManager.cancel()", PURPLE)
    sk.node(735, 205, 122, 54, "OrderBook", "removeOrder + diff", PURPLE)
    sk.node(735, 85, 122, 54, "Browser book", "ORDERBOOK_DIFF merged", BLUE)
    sk.arrow(148, 330, 185, 330, "HTTP", "1")
    sk.arrow(305, 330, 339, 330, "controller", "2")
    sk.arrow(471, 330, 520, 330, "Prisma tx", "3")
    sk.arrow(550, 308, 438, 230, "publish after DB cancel", "4", curve=-14)
    sk.arrow(460, 205, 505, 205, "subscribe", "5")
    sk.arrow(635, 205, 674, 205, "remove id", "6")
    sk.arrow(735, 178, 735, 112, "broadcast diff", "7")
    sk.note(55, 80, 315, 96, "Race to know", [
        "If matching already consumed the order, engine cancel can miss.",
        "API has already cancelled/refunded DB state for open remaining quantity.",
        "Production design should make cancel idempotent and sequence-safe.",
    ], colors.white)
    sk.finish_page()


def page_candles(sk: Sketch):
    sk.begin("7. Candle And Chart Flow", "Candles are trade-derived. Resting orders do not make chart candles.")
    sk.node(80, 330, 115, 54, "CandleChart", "mount + interval", BLUE)
    sk.node(235, 330, 122, 54, "HTTP history", "GET /market/:symbol/candles", BLUE)
    sk.node(390, 330, 100, 54, "DB", "Candle table", GRAY, "circle")
    sk.node(545, 330, 122, 54, "Chart render", "historical candles", BLUE)
    sk.arrow(137, 330, 174, 330, "loadCandles", "1")
    sk.arrow(296, 330, 342, 330, "read", "2")
    sk.arrow(438, 330, 484, 330, "return", "3")
    sk.node(210, 170, 120, 54, "TRADE_EVENT", "only after execution", RED, "circle")
    sk.node(390, 170, 126, 54, "candleStream", "build 1m/5m/15m/1h", GREEN)
    sk.node(560, 170, 105, 54, "DB", "upsert candle", GRAY, "circle")
    sk.node(720, 170, 125, 54, "WebSocket", "CANDLE_UPDATE", BLUE)
    sk.node(720, 70, 125, 54, "Chart rerender", "merge by bucket", BLUE)
    sk.arrow(270, 170, 327, 170, "listener", "4")
    sk.arrow(453, 170, 508, 170, "upsert", "5")
    sk.arrow(613, 170, 657, 170, "broadcast", "6")
    sk.arrow(720, 143, 720, 98, "store merge", "7")
    sk.note(55, 60, 340, 88, "Blank chart after reset", [
        "Expected when no trades have happened.",
        "Orderbook can have bids/asks from resting orders.",
        "Candles require executed trades, not accepted orders.",
    ], colors.white)
    sk.finish_page()


def page_pubsub(sk: Sketch):
    sk.begin("8. Publishers And Subscribers", "Exact answer to who publishes, who subscribes, and what happens next.")
    x0, y0 = 40, 380
    rows = [
        ("Redis orders", "Publisher: API order.producer", "Subscriber: engine redisConsumer", "Next: processOrder -> matching"),
        ("Redis cancel_orders", "Publisher: API order.controller", "Subscriber: engine redisConsumer", "Next: marketManager.cancel"),
        ("Redis trades", "Publisher: engine tradePublisher", "Subscriber: engine tradeWorker", "Next: DB trade/order/balance transaction"),
        ("TRADE_EVENT", "Publisher: Market.processOrder", "Subscribers: tradePublisher, tradeStream, candleStream", "Next: Redis trades, WS trade, candles"),
        ("ORDER_EVENT", "Publisher: Market.processOrder", "Subscriber: orderWorker", "Next: DB order status/remaining"),
        ("ORDERBOOK_DIFF_EVENT", "Publisher: OrderBook", "Subscriber: orderbookStream", "Next: snapshot cache + WS diff"),
        ("Browser SUBSCRIBE", "Publisher: websocket.ts", "Subscriber: wsServer", "Next: snapshot messages, then live broadcasts"),
    ]
    col_w = [125, 205, 220, 230]
    headers = ["Channel / event", "Publisher", "Subscriber", "Next action"]
    c = sk.c
    c.setFont("Helvetica-Bold", 8.5)
    c.setFillColor(INK)
    xx = x0
    for i, h in enumerate(headers):
        c.setFillColor(INK)
        c.rect(xx, y0, col_w[i], 22, fill=0, stroke=1)
        c.drawString(xx + 6, y0 + 7, h)
        xx += col_w[i]
    y = y0 - 46
    c.setFont("Helvetica", 7.2)
    for row in rows:
        xx = x0
        max_lines = 1
        line_sets = [wrap_text(cell, max(16, int(col_w[i] / 4.2))) for i, cell in enumerate(row)]
        max_lines = max(len(ls) for ls in line_sets)
        rh = max(34, max_lines * 8.5 + 10)
        for i, lines in enumerate(line_sets):
            c.setFillColor(colors.white if rows.index(row) % 2 == 0 else colors.HexColor("#f5f7fa"))
            c.rect(xx, y, col_w[i], rh, fill=1, stroke=1)
            c.setFillColor(INK)
            for j, line in enumerate(lines):
                c.drawString(xx + 6, y + rh - 14 - j * 8.5, line)
            xx += col_w[i]
        y -= rh
    sk.note(65, 40, 690, 54, "Core correction", [
        "Redis pub/sub delivers messages only. DB writes are done by API services and engine workers. WebSocket broadcasts are done by engine wsServer.",
    ], YELLOW)
    sk.finish_page()


def page_function_order(sk: Sketch):
    sk.begin("9. Function Map: Place Order", "Each card says what the function owns, what it changes, and what it calls next.")
    sk.card_grid([
        ("OrderForm.sendOrder(side)", [
            "Runs in browser after Buy/Sell click.",
            "Builds OrderInput: symbol, price, quantity, side, type='limit'.",
            "Calls placeOrder(); on success refreshWallet(), dispatches veltrix:orders-updated, shows toast.",
        ], BLUE),
        ("placeOrder(order, token, kind)", [
            "web-service/lib/api.ts.",
            "Builds endpoint with getOrderEndpointPath().",
            "POSTs JSON with Authorization header.",
        ], BLUE),
        ("authMiddleware(req,res,next)", [
            "API JWT gate.",
            "Reads Authorization bearer token.",
            "verifyToken() then attaches req.user.",
        ], GREEN),
        ("createOrder(req,res)", [
            "Controller adapter.",
            "validateOrder(req.body), generateId(), attach userId, status OPEN.",
            "Calls placeOrderService(order).",
        ], GREEN),
        ("placeOrderService(order)", [
            "Main order acceptance transaction.",
            "Rejects non-limit orders.",
            "Buy locks quote in User.balance/lockedQuote.",
            "Sell locks base in AssetBalance.free/lockedBase.",
            "Creates Order row.",
        ], GREEN),
        ("sendOrderToEngine(order)", [
            "API Redis producer.",
            "ensureRedisConnection().",
            "pub.publish('orders', JSON.stringify(order)).",
        ], YELLOW),
        ("ensureRedisConnection()", [
            "Connects lazy Redis publisher if needed.",
            "Throws 'Redis unavailable' if connection cannot be made.",
            "Protects publish path.",
        ], YELLOW),
        ("parseJsonResponse<T>()", [
            "Browser API response helper.",
            "Parses JSON/text, handles auth errors, throws clean errors.",
            "Returns typed OrderResponse on success.",
        ], BLUE),
        ("refreshWallet()", [
            "Wallet store reload after accepted order.",
            "Shows new available balance after funds/assets were locked.",
            "This is HTTP/DB truth, not WebSocket truth.",
        ], BLUE),
    ], cols=3, w=248, h=89)
    sk.finish_page()


def page_function_engine(sk: Sketch):
    sk.begin("10. Function Map: Engine Matching", "These functions are the runtime path after Redis orders reaches the engine.")
    sk.card_grid([
        ("startConsumer()", [
            "engine-service/queue/redisConsumer.ts.",
            "Connects Redis subscriber.",
            "sub.subscribe('orders','cancel_orders').",
        ], PURPLE),
        ("sub.on('message')", [
            "Parses channel payload.",
            "orders -> processOrder(data).",
            "cancel_orders -> marketManager.cancel(symbol,id).",
        ], PURPLE),
        ("toEngineOrder(incoming)", [
            "Converts API order shape into matching Order class.",
            "Keeps dbId as original DB id.",
            "Creates numeric engine id for orderbook index.",
        ], PURPLE),
        ("processOrder(incoming)", [
            "Adds order to orderStore.",
            "Calls marketManager.process(order).",
            "Returns matching result.",
        ], PURPLE),
        ("MarketManager.getMarket(symbol)", [
            "Finds existing Market or creates one.",
            "One Market owns one symbol's OrderBook and MatchingEngine.",
        ], PURPLE),
        ("Market.processOrder(order)", [
            "Calls matcher.process(order).",
            "For each trade emits TRADE_EVENT.",
            "Always emits ORDER_EVENT for incoming order.",
        ], PURPLE),
        ("MatchingEngine.process(order)", [
            "Compares incoming order with best opposite prices.",
            "Creates Trade objects on crossing prices.",
            "Leaves remaining limit quantity resting if needed.",
        ], PURPLE),
        ("OrderBook.addOrder(order)", [
            "Adds BUY to bids or SELL to asks.",
            "Creates price level if missing.",
            "Indexes order id for fast cancel.",
        ], PURPLE),
        ("OrderBook.popBestBid/Ask()", [
            "Removes best resting order during matching.",
            "Deletes empty price level.",
            "Emits level diff after mutation.",
        ], PURPLE),
        ("OrderBook.removeOrder(id)", [
            "Cancel path.",
            "Uses orderIndex to locate level.",
            "Removes order and emits ORDERBOOK_DIFF_EVENT.",
        ], PURPLE),
        ("emitLevelUpdate(side,level)", [
            "Builds diff: symbol, side, price, quantity.",
            "quantity=0 means remove price on client.",
            "eventBus.emit(ORDERBOOK_DIFF_EVENT,...).",
        ], BLUE),
        ("eventBus.emit(event,payload)", [
            "Local in-process fanout.",
            "Runs all registered handlers with Promise.allSettled.",
            "This is not Redis.",
        ], BLUE),
    ], cols=4, w=188, h=82, gap_x=13, gap_y=10)
    sk.finish_page()


def page_function_persistence_ws(sk: Sketch):
    sk.begin("11. Function Map: Persistence And WebSocket", "What every listener does after engine emits events.")
    sk.card_grid([
        ("tradePublisher listener", [
            "eventBus.on(TRADE_EVENT).",
            "Calls publish('trades', trade).",
            "Makes trade persistence message.",
        ], YELLOW),
        ("queue/publisher.publish()", [
            "Engine Redis publisher.",
            "Connects if possible.",
            "pub.publish(channel, JSON.stringify(data)).",
        ], YELLOW),
        ("startTradeWorker()", [
            "Subscribes to Redis channel trades.",
            "If Redis unavailable, persistence worker pauses.",
        ], GREEN),
        ("persistTrade(message)", [
            "Parses trade.",
            "Idempotency check by trade.id.",
            "Creates Trade row and updates both orders.",
            "Moves balances/assets in one DB transaction.",
        ], GREEN),
        ("startOrderWorker()", [
            "Registers ORDER_EVENT listener.",
            "Updates Order.remaining and status unless CANCELLED.",
        ], GREEN),
        ("statusForOrder(order)", [
            "remaining <= 0 -> FILLED.",
            "remaining < quantity -> PARTIALLY_FILLED.",
            "else OPEN.",
        ], GREEN),
        ("candleStream listener", [
            "eventBus.on(TRADE_EVENT).",
            "For 1m/5m/15m/1h calls updateCandleFromTrade().",
            "upsertCandle() and broadcast CANDLE_UPDATE.",
        ], BLUE),
        ("orderbookStream listener", [
            "eventBus.on(ORDERBOOK_DIFF_EVENT).",
            "getSnapshot(), nextSeq().",
            "Update cache then broadcast ORDERBOOK_DIFF.",
        ], BLUE),
        ("tradeStream listener", [
            "eventBus.on(TRADE_EVENT).",
            "addRecentTrade(trade).",
            "broadcast TRADE_UPDATE.",
        ], BLUE),
        ("wsServer connection", [
            "On SUBSCRIBE, stores socket in clients map by symbol.",
            "Immediately sends ORDERBOOK_SNAPSHOT, CANDLE_SNAPSHOT, TRADE_SNAPSHOT.",
        ], BLUE),
        ("broadcast(symbol,payload)", [
            "Looks up subscribed sockets for symbol.",
            "Sends JSON only to OPEN sockets.",
            "Redis is not involved.",
        ], BLUE),
        ("liveMarketStore.subscribe()", [
            "Browser side.",
            "Creates one socket per symbol.",
            "onmessage merges snapshots/diffs/trades/candles into Zustand.",
        ], BLUE),
    ], cols=4, w=188, h=82, gap_x=13, gap_y=10)
    sk.finish_page()


def page_events_detail(sk: Sketch):
    sk.begin("12. Event And Message Contracts", "What each event/message contains and what it causes.")
    rows = [
        ("Redis: orders", "Payload: API Order {id,userId,symbol,price,quantity,side,type,timestamp,status}", "Publisher: sendOrderToEngine", "Subscriber: redisConsumer -> processOrder"),
        ("Redis: cancel_orders", "Payload: {orderId,symbol,userId}", "Publisher: cancelOrder controller", "Subscriber: redisConsumer -> marketManager.cancel"),
        ("Redis: trades", "Payload: Trade from matching engine", "Publisher: tradePublisher", "Subscriber: tradeWorker -> persistTrade"),
        ("TRADE_EVENT", "Payload: {trade}", "Emitter: Market.processOrder", "Listeners: tradePublisher, tradeStream, candleStream"),
        ("ORDER_EVENT", "Payload: {order}", "Emitter: Market.processOrder", "Listener: orderWorker"),
        ("ORDERBOOK_DIFF_EVENT", "Payload: {symbol, side, price, quantity}", "Emitter: OrderBook.emitLevelUpdate", "Listener: orderbookStream"),
        ("WS: SUBSCRIBE", "Payload: {type:'SUBSCRIBE', symbol}", "Sender: websocket.ts onopen", "Receiver: wsServer connection handler"),
        ("WS: ORDERBOOK_SNAPSHOT", "Payload: {type, seq, data:{bids,asks}}", "Sender: wsServer on subscribe", "Receiver: liveMarketStore replaces book"),
        ("WS: ORDERBOOK_DIFF", "Payload: {type, seq, data:{symbol,side,price,quantity}}", "Sender: orderbookStream", "Receiver: liveMarketStore updates one level"),
        ("WS: TRADE_SNAPSHOT", "Payload: {type, data:recentTrades}", "Sender: wsServer on subscribe", "Receiver: liveMarketStore replaces trade tape"),
        ("WS: TRADE_UPDATE", "Payload: {type, data:tradeTapeItem}", "Sender: tradeStream", "Receiver: liveMarketStore prepends trade"),
        ("WS: CANDLE_SNAPSHOT", "Payload: {type, data:candles}", "Sender: wsServer on subscribe", "Receiver: liveMarketStore merges candles"),
        ("WS: CANDLE_UPDATE", "Payload: {type, data:candle}", "Sender: candleStream", "Receiver: liveMarketStore merges by interval:bucket"),
    ]
    x0, y0 = 34, 405
    col_w = [135, 310, 185, 185]
    c = sk.c
    headers = ["Event / channel", "Payload", "Publisher / emitter", "Subscriber / result"]
    c.setFont("Helvetica-Bold", 7.8)
    xx = x0
    for i, h in enumerate(headers):
        c.setFillColor(colors.white)
        c.rect(xx, y0, col_w[i], 20, fill=1, stroke=1)
        c.setFillColor(INK)
        c.drawString(xx + 5, y0 + 7, h)
        xx += col_w[i]
    y = y0 - 26
    c.setFont("Helvetica", 5.9)
    for idx, row in enumerate(rows):
        line_sets = [wrap_text(cell, max(14, int(col_w[i] / 3.8))) for i, cell in enumerate(row)]
        rh = max(24, max(len(ls) for ls in line_sets) * 7.2 + 8)
        xx = x0
        for i, lines in enumerate(line_sets):
            c.setFillColor(colors.white if idx % 2 == 0 else colors.HexColor("#f5f7fa"))
            c.rect(xx, y, col_w[i], rh, fill=1, stroke=1)
            c.setFillColor(INK)
            for j, line in enumerate(lines):
                c.drawString(xx + 4, y + rh - 10 - j * 7, line)
            xx += col_w[i]
        y -= rh
    sk.finish_page()


def flow_card(sk: Sketch, x, y, w, h, n, title, lines, fill):
    sk.card(x, y, w, h, f"{n}. {title}", lines, fill, title_size=7.3, body_size=5.6)


def integrated_intro(sk: Sketch):
    sk.begin("1. Integrated Veltrix Runtime Map", "Every box includes who runs, what it does, what it writes/emits, and who receives the next step.")
    boxes = [
        (44, 330, 125, 82, "Browser pages", ["Files: spot/future pages, OrderForm, CandleChart, OrderBook/Trades.", "Does: user actions, HTTP calls, WS subscribe.", "State: Zustand stores + localStorage token."], BLUE),
        (205, 330, 125, 82, "API service", ["Files: routes/controllers/services.", "Does: auth, validation, DB transactions.", "Publishes: Redis orders/cancel_orders."], GREEN),
        (365, 330, 125, 82, "Postgres DB", ["Tables: User, Order, AssetBalance, Trade, Candle, PaymentTopUp.", "Owns durable truth.", "Read by API + engine recovery/workers."], GRAY),
        (525, 330, 125, 82, "Redis pub/sub", ["Channels: orders, cancel_orders, trades.", "Only transports messages.", "Does not write DB or WS."], YELLOW),
        (685, 330, 125, 82, "Engine service", ["Files: redisConsumer, MarketManager, MatchingEngine, workers, wsServer.", "Does: match + emit events.", "Writes DB through workers."], PURPLE),
        (205, 155, 125, 82, "Engine events", ["TRADE_EVENT, ORDER_EVENT, ORDERBOOK_DIFF_EVENT.", "Local eventBus only.", "Listeners persist or broadcast."], RED),
        (365, 155, 125, 82, "WebSocket server", ["File: wsServer.ts.", "Stores clients by symbol.", "Sends snapshots + live updates."], BLUE),
        (525, 155, 125, 82, "Browser render", ["File: liveMarketStore.ts.", "Merges WS messages.", "Chart/book/trades rerender."], BLUE),
    ]
    centers = []
    for x, y, w, h, title, lines, fill in boxes:
        sk.card(x, y, w, h, title, lines, fill, 7.8, 5.7)
        centers.append((x + w / 2, y + h / 2))
    sk.arrow(169, 371, 205, 371, "HTTP", "1")
    sk.arrow(330, 371, 365, 371, "DB tx/read", "2")
    sk.arrow(490, 371, 525, 371, "publish", "3")
    sk.arrow(650, 371, 685, 371, "subscribe", "4")
    sk.arrow(747, 330, 270, 237, "emit events", "5", curve=-45)
    sk.arrow(330, 196, 365, 196, "broadcast listener", "6")
    sk.arrow(490, 196, 525, 196, "onmessage", "7")
    sk.note(40, 45, 720, 58, "One-line truth", [
        "Browser sends commands to API. API owns HTTP validation and initial durable writes. Redis carries commands/events. Engine owns matching and live market production. DB remains source of truth. WebSocket updates browser display.",
    ], colors.white)
    sk.finish_page()


def integrated_order_acceptance(sk: Sketch):
    sk.begin("2. Integrated Workflow: Limit Order Acceptance", "This page shows who does every step from page click until Redis orders is published.")
    w, h = 180, 86
    data = [
        (34, 345, "OrderForm.sendOrder(side)", ["Who: web component.", "Does: builds OrderInput from selected market, price, quantity, side.", "Calls: placeOrder()."], BLUE),
        (230, 345, "placeOrder(order,token,kind)", ["Who: web-service/lib/api.ts.", "Does: picks /order or /spot/:market/order endpoint.", "Sends: POST JSON + Authorization."], BLUE),
        (426, 345, "authMiddleware()", ["Who: API auth middleware.", "Does: verifies bearer JWT.", "Writes: req.user for controller."], GREEN),
        (622, 345, "createOrder()", ["Who: order.controller.ts.", "Does: validateOrder, generateId, attach userId.", "Calls: placeOrderService(order)."], GREEN),
        (34, 185, "placeOrderService()", ["Who: order.service.ts.", "Does: rejects non-limit; computes order value.", "DB tx begins here."], GREEN),
        (230, 185, "Buy/Sell lock branch", ["Buy: User.balance decrement; Order.lockedQuote.", "Sell: AssetBalance.free decrement, locked increment; Order.lockedBase."], GREEN),
        (426, 185, "tx.order.create()", ["Writes: Order row with status OPEN, remaining=quantity.", "Meaning: order is durable before engine sees it."], GRAY),
        (622, 185, "sendOrderToEngine()", ["Who: order.producer.ts.", "Does: ensureRedisConnection().", "Publishes: Redis channel orders."], YELLOW),
    ]
    for i, (x, y, title, lines, fill) in enumerate(data, 1):
        flow_card(sk, x, y, w, h, i, title, lines, fill)
    for x1, y1, x2, y2, n, label in [
        (214, 388, 230, 388, "1", "fetch"), (410, 388, 426, 388, "2", "HTTP"), (606, 388, 622, 388, "3", "next"),
        (712, 345, 124, 271, "4", "service"), (214, 228, 230, 228, "5", "lock"), (410, 228, 426, 228, "6", "create"), (606, 228, 622, 228, "7", "publish"),
    ]:
        sk.arrow(x1, y1, x2, y2, label, n, curve=-28 if n == "4" else 0)
    sk.finish_page()


def integrated_engine_matching(sk: Sketch):
    sk.begin("3. Integrated Workflow: Engine Consume, Match, Emit", "Every box is part of the actual matching path after Redis orders is delivered.")
    w, h = 178, 82
    data = [
        (34, 350, "startConsumer()", ["Who: redisConsumer.ts.", "Does: sub.subscribe('orders','cancel_orders').", "Listens: Redis messages."], YELLOW),
        (229, 350, "sub.on('message')", ["Does: JSON.parse(message).", "orders -> processOrder(data).", "cancel_orders -> marketManager.cancel()."], PURPLE),
        (424, 350, "toEngineOrder()", ["Who: consumer.ts.", "Does: keeps dbId, creates numeric engine id.", "Creates: matching Order object."], PURPLE),
        (619, 350, "marketManager.process()", ["Does: get/create Market(symbol).", "Calls: Market.processOrder(order).", "State: engine memory."], PURPLE),
        (34, 195, "MatchingEngine.process()", ["Does: compares with best bid/ask.", "If crossing: creates Trade objects.", "If not: order can rest."], PURPLE),
        (229, 195, "OrderBook mutation", ["Functions: addOrder, popBestBid/Ask, removeOrder.", "Writes: RBTree price levels + orderIndex.", "Emits level updates."], PURPLE),
        (424, 195, "Market.processOrder()", ["After matcher returns: for each trade emits TRADE_EVENT.", "Always emits ORDER_EVENT for incoming order."], RED),
        (619, 195, "eventBus.emit()", ["Local in-process fanout.", "Events: TRADE_EVENT, ORDER_EVENT, ORDERBOOK_DIFF_EVENT.", "Listeners run next."], RED),
    ]
    for i, (x, y, title, lines, fill) in enumerate(data, 1):
        flow_card(sk, x, y, w, h, i, title, lines, fill)
    arrows = [(212,391,229,391,"1","message"),(407,391,424,391,"2","parse"),(602,391,619,391,"3","process"),
              (708,350,123,277,"4","match"),(212,236,229,236,"5","mutate"),(407,236,424,236,"6","result"),(602,236,619,236,"7","emit")]
    for a in arrows:
        sk.arrow(*a[0:4], a[5], a[4], curve=-28 if a[4]=="4" else 0)
    sk.finish_page()


def integrated_persistence(sk: Sketch):
    sk.begin("4. Integrated Workflow: Persistence After Match", "This is where trades, orders, balances, and candles become durable.")
    w, h = 178, 82
    data = [
        (34, 350, "TRADE_EVENT", ["Emitter: Market.processOrder.", "Payload: { trade }.", "Listeners: tradePublisher, tradeStream, candleStream."], RED),
        (229, 350, "tradePublisher listener", ["Who: events/tradePublisher.ts.", "Does: publish('trades', trade).", "Channel: Redis trades."], YELLOW),
        (424, 350, "startTradeWorker()", ["Who: persistence/tradeWorker.ts.", "Listens: Redis trades.", "Queues: tradePersistQueue serializes DB work."], GREEN),
        (619, 350, "persistTrade()", ["Does: idempotency check by trade.id.", "DB tx: create Trade, update buy/sell orders.", "Moves balances/assets."], GREEN),
        (34, 195, "ORDER_EVENT", ["Emitter: Market.processOrder.", "Payload: { order }.", "Listener: orderWorker."], RED),
        (229, 195, "startOrderWorker()", ["Who: orderWorker.ts.", "Does: db.order.updateMany().", "Sets remaining + OPEN/PARTIALLY_FILLED/FILLED."], GREEN),
        (424, 195, "candleStream listener", ["Listens: TRADE_EVENT.", "Does: updateCandleFromTrade for 1m/5m/15m/1h.", "Writes: upsertCandle()."], GREEN),
        (619, 195, "Postgres durable state", ["Tables touched: Trade, Order, User, AssetBalance, Candle.", "Source of truth for wallet/history/recovery."], GRAY),
    ]
    for i, (x, y, title, lines, fill) in enumerate(data, 1):
        flow_card(sk, x, y, w, h, i, title, lines, fill)
    for a in [(212,391,229,391,"1","publish"),(407,391,424,391,"2","subscribe"),(602,391,619,391,"3","DB tx"),
              (123,350,123,277,"4","also emits"),(212,236,229,236,"5","listen"),(407,236,424,236,"6","trade"),(602,236,619,236,"7","write")]:
        sk.arrow(*a[0:4], a[5], a[4])
    sk.finish_page()


def integrated_websocket(sk: Sketch):
    sk.begin("5. Integrated Workflow: WebSocket And Live UI", "Redis does not broadcast to the browser; engine wsServer does.")
    w, h = 178, 82
    data = [
        (34, 350, "UI components mount", ["Who: CandleChart, Spot/FuturesOrderBook, Spot/FuturesTrades.", "Does: subscribe(symbol)."], BLUE),
        (229, 350, "liveMarketStore.subscribe()", ["Does: ref count per symbol.", "Creates: one WebSocket if not already open.", "Calls: connectWS(symbol)."], BLUE),
        (424, 350, "connectWS()", ["Who: websocket.ts.", "Does: new WebSocket(url).", "onopen sends {type:'SUBSCRIBE',symbol}."], BLUE),
        (619, 350, "wsServer connection", ["Who: engine wsServer.ts.", "Does: clients[symbol].add(ws).", "Sends snapshots immediately."], PURPLE),
        (34, 195, "Snapshot messages", ["ORDERBOOK_SNAPSHOT, CANDLE_SNAPSHOT, TRADE_SNAPSHOT.", "Receiver: liveMarketStore replaces/merges state."], BLUE),
        (229, 195, "Live stream listeners", ["orderbookStream -> ORDERBOOK_DIFF.", "tradeStream -> TRADE_UPDATE.", "candleStream -> CANDLE_UPDATE."], BLUE),
        (424, 195, "broadcast(symbol,payload)", ["Who: wsServer.ts.", "Does: sends JSON to OPEN sockets subscribed to symbol.", "No Redis here."], PURPLE),
        (619, 195, "React rerender", ["Store changes cause chart/orderbook/trades to rerender.", "Display is live but DB remains authoritative."], BLUE),
    ]
    for i, (x, y, title, lines, fill) in enumerate(data, 1):
        flow_card(sk, x, y, w, h, i, title, lines, fill)
    for a in [(212,391,229,391,"1","subscribe"),(407,391,424,391,"2","connect"),(602,391,619,391,"3","SUBSCRIBE"),
              (708,350,123,277,"4","snapshots"),(212,236,229,236,"5","later"),(407,236,424,236,"6","send"),(602,236,619,236,"7","merge")]:
        sk.arrow(*a[0:4], a[5], a[4], curve=-28 if a[4]=="4" else 0)
    sk.finish_page()


def integrated_cancel(sk: Sketch):
    sk.begin("6. Integrated Workflow: Cancel Order", "Cancel first changes durable DB state, then asks engine to remove book state.")
    w, h = 178, 82
    data = [
        (34, 350, "cancelOrder(token,id)", ["Who: web-service/lib/api.ts.", "Sends: DELETE /order/:orderId.", "Auth: bearer token."], BLUE),
        (229, 350, "cancelOrder controller", ["Who: order.controller.ts.", "Calls: cancelOrderService({orderId,userId}).", "Later publishes cancel_orders."], GREEN),
        (424, 350, "cancelOrderService()", ["Finds order, verifies owner.", "Requires OPEN/PARTIALLY_FILLED.", "DB tx starts."], GREEN),
        (619, 350, "DB cancel/refund", ["Writes: status CANCELLED, lockedQuote/base=0.", "Buy refund -> User.balance.", "Sell refund -> AssetBalance.free/locked."], GRAY),
        (34, 195, "Redis cancel_orders", ["Publisher: controller after DB success.", "Payload: {orderId,symbol,userId}."], YELLOW),
        (229, 195, "redisConsumer", ["Subscriber: cancel_orders.", "Calls: marketManager.cancel(symbol,toEngineOrderId(orderId))."], PURPLE),
        (424, 195, "OrderBook.removeOrder()", ["Uses orderIndex to locate level.", "Removes order.", "Emits ORDERBOOK_DIFF_EVENT."], PURPLE),
        (619, 195, "orderbookStream + WS", ["Updates snapshot cache.", "broadcasts ORDERBOOK_DIFF.", "Browser removes/changes price level."], BLUE),
    ]
    for i, (x, y, title, lines, fill) in enumerate(data, 1):
        flow_card(sk, x, y, w, h, i, title, lines, fill)
    for a in [(212,391,229,391,"1","HTTP"),(407,391,424,391,"2","service"),(602,391,619,391,"3","tx"),
              (708,350,123,277,"4","publish"),(212,236,229,236,"5","subscribe"),(407,236,424,236,"6","remove"),(602,236,619,236,"7","diff")]:
        sk.arrow(*a[0:4], a[5], a[4], curve=-28 if a[4]=="4" else 0)
    sk.finish_page()


def integrated_candles_market(sk: Sketch):
    sk.begin("7. Integrated Workflow: Candles, Stats, Activity Reads", "Historical reads come from API/DB. Live candles come from engine trade events.")
    w, h = 178, 82
    data = [
        (34, 350, "CandleChart.loadCandles()", ["Who: browser chart.", "Calls: getMarketCandles(symbol,interval,limit).", "Also subscribes to WS."], BLUE),
        (229, 350, "getMarketCandles API", ["Who: market.controller.ts.", "Parses interval/from/to/limit.", "Reads: getCandles() from Candle table."], GREEN),
        (424, 350, "candleStream live path", ["Listens: TRADE_EVENT.", "Builds OHLCV via updateCandleFromTrade().", "Writes: upsertCandle()."], GREEN),
        (619, 350, "CANDLE_UPDATE", ["Sender: candleStream broadcast().", "Receiver: liveMarketStore merges by interval:bucket.", "Chart rerenders."], BLUE),
        (34, 195, "MarketStatsBar", ["Calls: getMarketStats(symbols).", "API: getSessionStats(symbol).", "Reads: candles/trades-derived stats."], BLUE),
        (229, 195, "Open orders UI", ["Calls: getOpenOrders(token).", "API: activity.controller getOpenOrders().", "Reads: getOpenOrdersByUser(userId)."], BLUE),
        (424, 195, "Trade history UI", ["Calls: getTradeHistory(token).", "API: getTradeHistory().", "Reads: getTradesByUser(userId)."], BLUE),
        (619, 195, "DB read models", ["Tables: Candle, Order, Trade.", "Used for history/account pages.", "Not real-time matching state."], GRAY),
    ]
    for i, (x, y, title, lines, fill) in enumerate(data, 1):
        flow_card(sk, x, y, w, h, i, title, lines, fill)
    for a in [(212,391,229,391,"1","HTTP"),(407,391,424,391,"2","history/live split"),(602,391,619,391,"3","WS"),
              (212,236,229,236,"4","HTTP"),(407,236,424,236,"5","HTTP"),(602,236,619,236,"6","read")]:
        sk.arrow(*a[0:4], a[5], a[4])
    sk.finish_page()


def integrated_wallet_payment(sk: Sketch):
    sk.begin("8. Integrated Workflow: Wallet And Payment Top-Up", "Wallet is DB-owned. Stripe top-up is made idempotent with PaymentTopUp.")
    w, h = 178, 82
    data = [
        (34, 350, "useWalletStore.loadWallet()", ["Who: browser wallet store.", "Reads token from localStorage.", "Calls: getWallet(token)."], BLUE),
        (229, 350, "getWallet API client", ["Who: web-service/lib/api.ts.", "GET /wallet with Authorization.", "Parses WalletResponse."], BLUE),
        (424, 350, "wallet.controller getWallet()", ["Who: API.", "getAuthUser(req).", "Reads User.balance + assetBalances."], GREEN),
        (619, 350, "Wallet UI state", ["Store sets wallet/loading/error.", "Shows balance, free assets, locked assets.", "No WS balance calculation."], BLUE),
        (34, 195, "createStripeCheckout()", ["Who: payments.controller.ts.", "Validates auth + amount >= 5.", "Calls Stripe checkout API."], GREEN),
        (229, 195, "PaymentTopUp PENDING", ["Writes DB row with stripeSessionId,userId,amountUsd,status PENDING.", "Returns Stripe checkout URL."], GRAY),
        (424, 195, "confirm/webhook", ["confirmStripeCheckout() verifies session belongs to user.", "handleStripeWebhook() verifies signature.", "Both call creditCompletedStripeSession()."], GREEN),
        (619, 195, "creditCompletedStripeSession()", ["DB tx: unique stripeSessionId prevents double credit.", "Upserts PaymentTopUp COMPLETED.", "Increments User.balance."], GRAY),
    ]
    for i, (x, y, title, lines, fill) in enumerate(data, 1):
        flow_card(sk, x, y, w, h, i, title, lines, fill)
    for a in [(212,391,229,391,"1","HTTP"),(407,391,424,391,"2","API"),(602,391,619,391,"3","set"),
              (212,236,229,236,"4","Stripe"),(407,236,424,236,"5","return/async"),(602,236,619,236,"6","credit")]:
        sk.arrow(*a[0:4], a[5], a[4])
    sk.finish_page()


def integrated_auth_recovery(sk: Sketch):
    sk.begin("9. Integrated Workflow: Auth And Engine Recovery", "Auth creates identity; recovery rebuilds engine memory from durable DB state.")
    w, h = 178, 82
    data = [
        (34, 350, "Register/Login form", ["Who: browser auth components.", "Calls: registerUser() or loginUser().", "Stores token/user for later API calls."], BLUE),
        (229, 350, "auth.controller", ["register/login endpoints.", "Calls auth.service.", "Returns JWT + user."], GREEN),
        (424, 350, "auth.service", ["registerUser: validate, check existing, bcrypt hash, create user.", "loginUser: validate, compare password."], GREEN),
        (619, 350, "auth.utils", ["generateToken(user).", "verifyToken(token).", "JWT used by authMiddleware."], GREEN),
        (34, 195, "engine index.ts boot", ["Imports listeners: tradePublisher, candleStream, wsServer, orderbookStream, tradeStream.", "Starts consumers/workers."], PURPLE),
        (229, 195, "loadOpenOrders()", ["Reads durable OPEN/PARTIALLY_FILLED orders from DB.", "This is recovery source."], GRAY),
        (424, 195, "rebuildEngine()", ["Adds DB open orders back into MarketManager books.", "Recreates in-memory matching state."], PURPLE),
        (619, 195, "rebuildSnapshots()", ["Builds WS snapshot cache from rebuilt books.", "New clients receive current ORDERBOOK_SNAPSHOT."], BLUE),
    ]
    for i, (x, y, title, lines, fill) in enumerate(data, 1):
        flow_card(sk, x, y, w, h, i, title, lines, fill)
    for a in [(212,391,229,391,"1","HTTP"),(407,391,424,391,"2","service"),(602,391,619,391,"3","JWT"),
              (212,236,229,236,"4","DB read"),(407,236,424,236,"5","memory"),(602,236,619,236,"6","snapshot")]:
        sk.arrow(*a[0:4], a[5], a[4])
    sk.finish_page()


def page_recovery(sk: Sketch):
    sk.begin("13. Engine Startup And Recovery", "How the in-memory engine gets rebuilt after restart.")
    nodes = [
        (70, "index.ts imports listeners"),
        (205, "startConsumer orders/cancel_orders"),
        (350, "startTradeWorker trades"),
        (495, "startOrderWorker ORDER_EVENT"),
        (640, "loadOpenOrders from DB"),
        (770, "rebuild engine + snapshots"),
    ]
    last = None
    for i, (x, title) in enumerate(nodes, 1):
        sk.node(x, 310, 112, 54, title, "", PURPLE if i < 5 else GREEN)
        if last:
            sk.arrow(last + 56, 310, x - 56, 310, "", str(i - 1))
        last = x
    sk.node(640, 180, 95, 52, "DB", "open orders", GRAY, "circle")
    sk.node(770, 180, 122, 52, "WS snapshots", "new clients get current book", BLUE)
    sk.arrow(640, 283, 640, 206, "read", "5")
    sk.arrow(770, 283, 770, 206, "prepare", "6")
    sk.note(70, 90, 675, 70, "Why stale data can appear", [
        "DB reset alone does not clear engine memory. The orderbook and snapshot cache live inside the engine process.",
        "Restart engine after clearing DB/Redis if you want a clean market state.",
    ], colors.white)
    sk.finish_page()


def page_debug(sk: Sketch):
    sk.begin("14. Debug Map", "When something looks wrong, follow the same arrows the data follows.")
    sk.node(100, 320, 120, 54, "Order missing", "UI says accepted", RED)
    sk.node(270, 390, 125, 50, "1 API response", "network tab", BLUE)
    sk.node(430, 390, 105, 50, "2 DB Order", "row exists?", GRAY)
    sk.node(590, 390, 120, 50, "3 Redis publish", "orders log", YELLOW)
    sk.node(750, 390, 120, 50, "4 Engine consume", "redisConsumer log", PURPLE)
    sk.node(590, 260, 120, 50, "5 Book/event", "diff emitted?", PURPLE)
    sk.node(750, 260, 120, 50, "6 WS/store", "message received?", BLUE)
    sk.arrow(160, 335, 212, 378, "", "1", curve=8)
    sk.arrow(332, 390, 377, 390, "", "2")
    sk.arrow(482, 390, 530, 390, "", "3")
    sk.arrow(650, 390, 690, 390, "", "4")
    sk.arrow(750, 365, 640, 285, "", "5", curve=-18)
    sk.arrow(650, 260, 690, 260, "", "6")
    sk.note(70, 115, 220, 82, "If DB row exists but engine does not see it", [
        "Problem is Redis publish, Redis availability, or engine consumer.",
    ], colors.white)
    sk.note(330, 115, 230, 82, "If engine sees it but browser does not", [
        "Problem is orderbookStream/wsServer/liveMarketStore subscription.",
    ], colors.white)
    sk.note(590, 115, 220, 82, "If chart is blank", [
        "Check trades first. Candles only update from TRADE_EVENT.",
    ], colors.white)
    sk.finish_page()


def build():
    sk = Sketch(OUT)
    integrated_intro(sk)
    integrated_order_acceptance(sk)
    integrated_engine_matching(sk)
    integrated_persistence(sk)
    integrated_websocket(sk)
    integrated_cancel(sk)
    integrated_candles_market(sk)
    integrated_wallet_payment(sk)
    integrated_auth_recovery(sk)
    page_events_detail(sk)
    page_debug(sk)
    sk.save()


if __name__ == "__main__":
    build()
