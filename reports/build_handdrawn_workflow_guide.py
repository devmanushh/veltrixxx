from __future__ import annotations

import math
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.pdfgen import canvas


OUT = Path(r"C:\Users\DEV\Desktop\veltrix diagram.pdf")
W, H = landscape(A4)

INK = colors.HexColor("#1f252d")
MUTED = colors.HexColor("#515b6b")
PAPER = colors.HexColor("#fbfaf4")
GRID = colors.HexColor("#eceff3")
BLUE = colors.HexColor("#e4f0ff")
GREEN = colors.HexColor("#e2f7e9")
YELLOW = colors.HexColor("#fff1bd")
PURPLE = colors.HexColor("#efe6ff")
PINK = colors.HexColor("#ffe4df")
GRAY = colors.HexColor("#edf1f6")
WHITE = colors.white


def wrap(text: str, n: int) -> list[str]:
    out: list[str] = []
    line = ""
    for word in text.split():
        trial = f"{line} {word}".strip()
        if len(trial) > n and line:
            out.append(line)
            line = word
        else:
            line = trial
    if line:
        out.append(line)
    return out


class Map:
    def __init__(self):
        self.c = canvas.Canvas(str(OUT), pagesize=landscape(A4))
        self.page = 0

    def start(self, title: str, subtitle: str = ""):
        self.page += 1
        c = self.c
        c.setFillColor(PAPER)
        c.rect(0, 0, W, H, fill=1, stroke=0)
        c.setStrokeColor(GRID)
        c.setLineWidth(0.32)
        for x in range(0, int(W) + 1, 28):
            c.line(x, 0, x, H)
        for y in range(0, int(H) + 1, 28):
            c.line(0, y, W, y)
        c.setFillColor(INK)
        c.setFont("Helvetica-BoldOblique", 17)
        c.drawString(28, H - 34, title)
        c.setFillColor(MUTED)
        c.setFont("Helvetica-Oblique", 8.4)
        c.drawString(30, H - 49, subtitle)
        c.setFont("Helvetica-Oblique", 7)
        c.drawRightString(W - 28, 18, f"accurate hand-map | page {self.page}")

    def finish(self):
        self.c.showPage()

    def save(self):
        self.c.save()

    def oval(self, x, y, w, h, title, lines=(), fill=GRAY, fs=8.8, body=6.3):
        c = self.c
        c.setFillColor(fill)
        c.setStrokeColor(INK)
        c.setLineWidth(1.15)
        c.ellipse(x - w / 2, y - h / 2, x + w / 2, y + h / 2, fill=1, stroke=1)
        c.setStrokeColor(colors.HexColor("#667085"))
        c.ellipse(x - w / 2 + 2, y - h / 2 - 1, x + w / 2 + 2, y + h / 2 - 2, fill=0, stroke=1)
        c.setFillColor(INK)
        c.setFont("Helvetica-BoldOblique", fs)
        yy = y + h / 2 - 15
        for t in wrap(title, max(9, int(w / 5.0)))[:2]:
            c.drawCentredString(x, yy, t)
            yy -= fs + 1.5
        c.setFont("Helvetica-Oblique", body)
        yy -= 1
        for line in lines:
            for t in wrap(line, max(12, int(w / 4.2)))[:2]:
                c.drawCentredString(x, yy, t)
                yy -= body + 1.7

    def note(self, x, y, w, h, title, lines=(), fill=WHITE):
        c = self.c
        c.setFillColor(fill)
        c.setStrokeColor(INK)
        c.setLineWidth(1)
        c.rect(x, y, w, h, fill=1, stroke=1)
        c.setStrokeColor(colors.HexColor("#667085"))
        c.rect(x + 2, y - 2, w, h, fill=0, stroke=1)
        c.setFillColor(INK)
        c.setFont("Helvetica-BoldOblique", 8.4)
        c.drawString(x + 7, y + h - 13, title)
        c.setFont("Helvetica-Oblique", 6.4)
        yy = y + h - 25
        for line in lines:
            for t in wrap(line, max(14, int(w / 4.15))):
                if yy < y + 5:
                    return
                c.drawString(x + 7, yy, t)
                yy -= 7.5

    def side(self, x, y, title, lines):
        c = self.c
        c.setFillColor(INK)
        c.setFont("Helvetica-BoldOblique", 8.8)
        c.drawString(x, y, title)
        c.line(x, y - 2, x + min(190, len(title) * 5.2), y - 2)
        c.setFont("Helvetica-Oblique", 6.6)
        yy = y - 14
        for line in lines:
            for t in wrap(line, 38):
                c.drawString(x, yy, t)
                yy -= 7.8

    def arrow(self, x1, y1, x2, y2, n, label, curve=0, shift=(0, 0), dashed=False):
        c = self.c
        c.setStrokeColor(INK)
        c.setFillColor(INK)
        c.setLineWidth(1.2)
        c.setDash(5, 3) if dashed else c.setDash()
        if curve:
            mx, my = (x1 + x2) / 2, (y1 + y2) / 2
            dx, dy = x2 - x1, y2 - y1
            length = max(math.hypot(dx, dy), 1)
            nx, ny = -dy / length, dx / length
            cx, cy = mx + nx * curve, my + ny * curve
            c.bezier(x1, y1, cx, cy, cx, cy, x2, y2)
            lx, ly = cx + shift[0], cy + shift[1]
            angle = math.atan2(y2 - cy, x2 - cx)
        else:
            c.line(x1, y1, x2, y2)
            lx, ly = (x1 + x2) / 2 + shift[0], (y1 + y2) / 2 + shift[1]
            angle = math.atan2(y2 - y1, x2 - x1)
        c.setDash()
        self.head(x2, y2, angle)
        c.setFillColor(WHITE)
        c.circle(lx - 9, ly + 8, 7.6, fill=1, stroke=0)
        c.setStrokeColor(INK)
        c.circle(lx - 9, ly + 8, 7.6, fill=0, stroke=1)
        c.setFillColor(INK)
        c.setFont("Helvetica-BoldOblique", 6.7)
        c.drawCentredString(lx - 9, ly + 5.5, str(n))
        c.setFont("Helvetica-Oblique", 6.2)
        yy = ly - 3
        for t in wrap(label, 34)[:4]:
            c.drawString(lx + 4, yy, t)
            yy -= 7.3

    def head(self, x, y, angle):
        c = self.c
        size = 6.5
        for a in (angle + math.pi * 0.82, angle - math.pi * 0.82):
            c.line(x, y, x + math.cos(a) * size, y + math.sin(a) * size)


def page_whole(m: Map):
    m.start("1. Whole App Order Flow - accurate main map", "Corrected: TRADE_EVENT -> tradePublisher -> Redis trades -> tradeWorker -> DB. eventBus itself is local only.")
    m.oval(78, 292, 82, 56, "API", ["createOrder()", "placeOrderService()"], GREEN)
    m.oval(240, 405, 86, 56, "DB", ["Order/User", "AssetBalance"], GRAY)
    m.oval(255, 292, 92, 56, "Redis", ["orders", "cancel_orders"], YELLOW)
    m.oval(450, 310, 138, 66, "Engine", ["redisConsumer", "MatchingEngine"], PURPLE)
    m.oval(425, 190, 98, 56, "eventBus", ["local events only"], PINK)
    m.oval(220, 155, 112, 56, "Redis trades", ["published by", "tradePublisher"], YELLOW)
    m.oval(240, 70, 120, 54, "tradeWorker", ["subscribes trades", "persistTrade()"], GREEN)
    m.oval(555, 190, 118, 56, "WS streams", ["trade/orderbook", "candle streams"], BLUE)
    m.oval(700, 190, 102, 54, "Browser WS", ["liveMarketStore", "rerender UI"], BLUE)
    m.note(610, 320, 185, 96, "DB writes after match", [
        "orderWorker listens ORDER_EVENT -> Order status.",
        "tradeWorker listens Redis trades -> Trade/Order/User/AssetBalance.",
        "candleStream listens TRADE_EVENT -> Candle.",
    ])
    m.arrow(110, 315, 205, 392, 1, "placeOrderService DB tx: lock funds/assets + create OPEN Order", 38, (-20, 4))
    m.arrow(112, 292, 208, 292, 2, "sendOrderToEngine publishes Redis 'orders'", -18, (-16, -12))
    m.arrow(300, 292, 380, 305, 3, "redisConsumer subscribed; processOrder(data)", 18, (-8, 8))
    m.arrow(450, 276, 430, 218, 4, "Market.processOrder emits TRADE_EVENT + ORDER_EVENT; OrderBook emits ORDERBOOK_DIFF_EVENT", -18, (-16, -5))
    m.arrow(398, 176, 255, 155, 5, "tradePublisher listener publishes TRADE_EVENT payload to Redis 'trades'", -22, (-35, -8))
    m.arrow(224, 126, 238, 98, 6, "tradeWorker subscribed to trades; writes trade settlement DB tx", 8, (6, -4))
    m.arrow(260, 95, 245, 376, 7, "persistTrade writes DB; orderWorker/candleStream also write DB paths", -55, (-40, 8))
    m.arrow(462, 180, 520, 190, 8, "tradeStream/orderbookStream/candleStream call wsServer.broadcast", 18, (-10, 8))
    m.arrow(610, 190, 650, 190, 9, "browser socket receives JSON messages", 0, (0, 15))
    m.side(28, 460, "Accuracy notes", [
        "Redis orders -> engine command.",
        "Redis trades -> persistence command.",
        "eventBus is in-process, not Redis.",
        "Redis never sends WebSocket.",
        "WS is engine -> browser.",
    ])
    m.finish()


def page_place_order(m: Map):
    m.start("2. Place Order Workflow", "Every arrow is a real function handoff from page submit to engine command.")
    m.note(34, 320, 145, 70, "OrderForm.sendOrder()", ["Builds OrderInput.", "Calls placeOrder().", "After success: refreshWallet, toast, orders-updated."], BLUE)
    m.oval(220, 350, 118, 54, "placeOrder()", ["lib/api.ts", "POST + JWT"], BLUE)
    m.oval(365, 350, 118, 54, "authMiddleware()", ["verifyToken()", "sets req.user"], GREEN)
    m.oval(510, 350, 118, 54, "createOrder()", ["validateOrder", "generateId"], GREEN)
    m.oval(660, 350, 130, 58, "placeOrderService()", ["limit only", "DB tx"], GREEN)
    m.oval(540, 220, 112, 55, "Postgres", ["Order OPEN", "funds locked"], GRAY)
    m.oval(340, 220, 132, 55, "sendOrderToEngine()", ["ensure Redis", "publish orders"], YELLOW)
    m.oval(150, 220, 108, 55, "Redis orders", ["engine receives", "API Order payload"], YELLOW)
    m.arrow(179, 350, 160, 350, 1, "Buy/Sell click enters OrderForm handler", 0, (-8, 18))
    m.arrow(279, 350, 306, 350, 2, "fetch endpoint chosen from marketKind", 0, (2, 15))
    m.arrow(424, 350, 451, 350, 3, "Express route protected by auth", 0, (0, 15))
    m.arrow(569, 350, 595, 350, 4, "controller calls service", 0, (0, 15))
    m.arrow(650, 320, 580, 245, 5, "buy: User.balance-- + lockedQuote; sell: AssetBalance.free-- locked++", -34, (-45, -5))
    m.arrow(500, 220, 406, 220, 6, "after DB tx succeeds, publish command", 12, (-22, 10))
    m.arrow(275, 220, 204, 220, 7, "Redis pub/sub message to engine", 0, (-12, 14))
    m.side(630, 190, "Meaning of success", [
        "HTTP success means accepted and published.",
        "It does not mean the order filled.",
        "Fill/resting update arrives later by WS.",
    ])
    m.finish()


def page_engine(m: Map):
    m.start("3. Engine Matching Workflow", "API does not match. DB does not match. This page is the engine memory path.")
    m.oval(75, 335, 104, 54, "Redis orders", ["message"], YELLOW)
    m.oval(210, 335, 126, 56, "redisConsumer", ["startConsumer()", "sub.on message"], PURPLE)
    m.oval(360, 335, 128, 56, "consumer.ts", ["toEngineOrder()", "processOrder()"], PURPLE)
    m.oval(510, 335, 128, 56, "MarketManager", ["getMarket()", "process()"], PURPLE)
    m.oval(665, 335, 132, 56, "MatchingEngine", ["best bid/ask", "price-time"], PURPLE)
    m.oval(665, 215, 132, 56, "OrderBook", ["RBTree levels", "orderIndex"], PURPLE)
    m.oval(420, 170, 140, 56, "ORDERBOOK_DIFF", ["emitLevelUpdate()", "{symbol,side,price,qty}"], PINK)
    m.oval(580, 100, 116, 54, "ORDER_EVENT", ["incoming order", "remaining/status"], PINK)
    m.oval(735, 100, 116, 54, "TRADE_EVENT", ["each execution", "trade payload"], PINK)
    m.arrow(127, 335, 147, 335, 1, "message delivered", 0, (0, 14))
    m.arrow(273, 335, 296, 335, 2, "parse + channel branch", 0, (0, 14))
    m.arrow(424, 335, 446, 335, 3, "keeps dbId + numeric engine id", 0, (0, 14))
    m.arrow(574, 335, 599, 335, 4, "Market.processOrder()", 0, (0, 14))
    m.arrow(665, 307, 665, 243, 5, "matcher mutates book: add/pop/remove", 12, (8, 0))
    m.arrow(620, 215, 485, 185, 6, "level changed -> ORDERBOOK_DIFF_EVENT; qty 0 removes price", -24, (-24, -5))
    m.arrow(640, 205, 594, 125, 7, "after processing incoming order -> ORDER_EVENT", -20, (0, -4))
    m.arrow(700, 205, 735, 128, 8, "if crossing, Trade object -> TRADE_EVENT", 24, (2, -2))
    m.note(30, 105, 250, 84, "No match vs match", [
        "No crossing: order rests; book diff + order event.",
        "Crossing: trade event(s), order event, and book diff(s).",
        "All of this is engine process memory first.",
    ])
    m.finish()


def page_trade_fanout(m: Map):
    m.start("4. TRADE_EVENT Fanout Workflow", "This is the corrected Redis trades path plus live WebSocket fanout.")
    m.oval(365, 405, 112, 56, "TRADE_EVENT", ["emitted by", "Market.processOrder"], PINK)
    m.oval(165, 315, 128, 56, "tradePublisher", ["eventBus listener", "publish trades"], YELLOW)
    m.oval(165, 220, 110, 54, "Redis trades", ["payload = trade"], YELLOW)
    m.oval(165, 125, 128, 56, "tradeWorker", ["subscribe trades", "persistTrade()"], GREEN)
    m.oval(365, 125, 112, 56, "DB", ["Trade/Order", "balances/assets"], GRAY)
    m.oval(560, 315, 124, 56, "tradeStream", ["addRecentTrade", "TRADE_UPDATE"], BLUE)
    m.oval(700, 315, 124, 56, "candleStream", ["updateCandle", "upsert + WS"], BLUE)
    m.oval(635, 205, 118, 56, "wsServer", ["broadcast()", "symbol clients"], BLUE)
    m.note(565, 95, 200, 62, "Browser receives", ["TRADE_UPDATE updates trade tape.", "CANDLE_UPDATE updates chart.", "ORDERBOOK_DIFF updates book."], BLUE)
    m.arrow(335, 390, 220, 335, 1, "tradePublisher listens to TRADE_EVENT", 28, (-24, 0))
    m.arrow(165, 287, 165, 247, 2, "publish('trades', trade)", 10, (8, 0))
    m.arrow(165, 193, 165, 153, 3, "tradeWorker subscribed to Redis trades", 10, (8, 0))
    m.arrow(220, 125, 310, 125, 4, "persistTrade DB tx: idempotent trade, update orders, move balances", 18, (-15, 12))
    m.arrow(395, 390, 530, 335, 5, "tradeStream listens directly to eventBus, not Redis", -24, (-18, 0))
    m.arrow(405, 405, 675, 340, 6, "candleStream listens to eventBus; writes Candle and broadcasts", -32, (-40, 5))
    m.arrow(575, 287, 620, 235, 7, "wsServer.broadcast TRADE_UPDATE", -18, (0, 0))
    m.arrow(700, 287, 660, 235, 8, "wsServer.broadcast CANDLE_UPDATE", 18, (0, 0))
    m.arrow(635, 177, 640, 157, 9, "browser onmessage merges state", 0, (12, -2))
    m.side(30, 455, "Precise answer", [
        "eventBus emits TRADE_EVENT.",
        "tradePublisher publishes that trade to Redis trades.",
        "tradeWorker subscribes Redis trades and writes DB.",
        "tradeStream/candleStream broadcast WS from eventBus.",
    ])
    m.finish()


def page_orderbook_ws(m: Map):
    m.start("5. ORDERBOOK_DIFF and WebSocket Workflow", "How book levels become browser orderbook rows.")
    m.oval(105, 335, 130, 58, "OrderBook", ["add/pop/remove", "emitLevelUpdate"], PURPLE)
    m.oval(285, 335, 130, 58, "eventBus", ["ORDERBOOK_DIFF", "{symbol,side,price,qty}"], PINK)
    m.oval(465, 335, 140, 58, "orderbookStream", ["getSnapshot()", "nextSeq()"], BLUE)
    m.oval(650, 335, 122, 58, "wsServer", ["broadcast()", "symbol sockets"], BLUE)
    m.oval(650, 195, 140, 58, "liveMarketStore", ["ORDERBOOK_SNAPSHOT", "ORDERBOOK_DIFF"], BLUE)
    m.oval(465, 195, 120, 58, "OrderBook UI", ["sort asks/bids", "render top levels"], BLUE)
    m.oval(285, 195, 125, 58, "New WS client", ["SUBSCRIBE symbol", "gets snapshots"], BLUE)
    m.arrow(170, 335, 220, 335, 1, "level change -> emit diff; qty 0 means remove", 0, (0, 15))
    m.arrow(350, 335, 395, 335, 2, "listener receives diff", 0, (0, 15))
    m.arrow(535, 335, 589, 335, 3, "snapshot cache updated + seq incremented", 0, (-5, 15))
    m.arrow(650, 306, 650, 224, 4, "browser receives JSON", 18, (8, 0))
    m.arrow(590, 195, 525, 195, 5, "merge price level in store", 0, (0, 15))
    m.arrow(345, 195, 405, 195, 6, "React rerender", 0, (0, 15))
    m.arrow(285, 224, 610, 315, 7, "on subscribe wsServer sends ORDERBOOK_SNAPSHOT + CANDLE_SNAPSHOT + TRADE_SNAPSHOT first", 45, (-55, 8), dashed=True)
    m.finish()


def page_cancel(m: Map):
    m.start("6. Cancel Order Workflow", "DB cancel/refund happens before Redis cancel_orders asks engine to remove from memory.")
    m.oval(90, 350, 120, 54, "cancelOrder()", ["web lib/api", "DELETE /order/:id"], BLUE)
    m.oval(250, 350, 128, 56, "cancelOrder ctrl", ["calls service", "publishes after DB"], GREEN)
    m.oval(425, 350, 140, 58, "cancelOrderService", ["verify owner/status", "DB tx refund"], GREEN)
    m.oval(600, 350, 110, 55, "DB", ["CANCELLED", "locked=0 refund"], GRAY)
    m.oval(425, 235, 126, 55, "Redis cancel_orders", ["{orderId,symbol,userId}"], YELLOW)
    m.oval(600, 235, 130, 55, "redisConsumer", ["marketManager.cancel", "toEngineOrderId"], PURPLE)
    m.oval(735, 235, 118, 55, "OrderBook.remove", ["remove order", "emit diff"], PURPLE)
    m.oval(735, 110, 118, 55, "WS book update", ["ORDERBOOK_DIFF", "browser removes level"], BLUE)
    m.arrow(150, 350, 185, 350, 1, "HTTP + JWT", 0, (0, 15))
    m.arrow(314, 350, 355, 350, 2, "service call", 0, (0, 15))
    m.arrow(495, 350, 545, 350, 3, "DB transaction", 0, (0, 15))
    m.arrow(600, 322, 470, 260, 4, "after DB success publish cancel_orders", -30, (-25, -4))
    m.arrow(488, 235, 535, 235, 5, "engine subscribed", 0, (0, 15))
    m.arrow(665, 235, 676, 235, 6, "remove from memory", 0, (0, 15))
    m.arrow(735, 208, 735, 138, 7, "ORDERBOOK_DIFF -> WS", 12, (9, 0))
    m.note(55, 90, 300, 72, "Race note", ["If engine already matched the order, cancel can miss the book entry.", "Production needs idempotent cancel and sequencing guarantees."], WHITE)
    m.finish()


def page_reads(m: Map):
    m.start("7. Reads, Candles, Wallet, Payment", "Non-matching workflows that still matter for the full app.")
    m.note(35, 335, 210, 78, "Candles/history", [
        "CandleChart.loadCandles -> getMarketCandles() -> market.controller.getMarketCandles.",
        "Reads Candle table. Live candles come from candleStream on TRADE_EVENT.",
    ], BLUE)
    m.note(310, 335, 210, 78, "Market stats + activity", [
        "MarketStatsBar -> getMarketStats -> getSessionStats.",
        "Open orders/trade history -> activity.controller -> DB repositories.",
    ], BLUE)
    m.note(585, 335, 210, 78, "Wallet", [
        "useWalletStore.loadWallet -> getWallet(token) -> wallet.controller.getWallet.",
        "Reads User.balance + AssetBalance free/locked from DB.",
    ], GREEN)
    m.note(35, 170, 250, 95, "Payment top-up", [
        "createStripeCheckout validates amount/auth and calls Stripe.",
        "Creates PaymentTopUp PENDING.",
        "confirmStripeCheckout/webhook call creditCompletedStripeSession.",
        "Unique stripeSessionId prevents double credit; User.balance increments.",
    ], GREEN)
    m.note(330, 170, 220, 95, "Auth", [
        "register/login forms call API auth endpoints.",
        "auth.service validates, hashes/compares password.",
        "auth.utils generateToken/verifyToken.",
        "authMiddleware protects order/wallet/activity/payment routes.",
    ], GREEN)
    m.note(595, 170, 205, 95, "Engine recovery", [
        "index.ts starts Redis consumers/workers/listeners.",
        "loadOpenOrders reads DB.",
        "rebuildEngine restores orderbooks.",
        "rebuildSnapshots restores WS snapshot cache.",
    ], PURPLE)
    m.finish()


def page_live_subscription(m: Map):
    m.start("8. Live Market Subscription Workflow", "How a page gets snapshots first, then continuous live updates.")
    m.oval(90, 350, 125, 55, "CandleChart", ["useEffect()", "subscribe(symbol)"], BLUE)
    m.oval(90, 250, 125, 55, "OrderBook / Trades", ["useEffect()", "subscribe(symbol)"], BLUE)
    m.oval(265, 300, 138, 58, "liveMarketStore", ["refs per symbol", "sockets Map"], BLUE)
    m.oval(445, 300, 125, 56, "connectWS()", ["new WebSocket", "onopen send SUBSCRIBE"], BLUE)
    m.oval(625, 300, 135, 58, "wsServer.ts", ["clients Map", "symbol -> Set<ws>"], PURPLE)
    m.oval(625, 160, 135, 58, "initial snapshots", ["ORDERBOOK", "CANDLE + TRADE"], GREEN)
    m.oval(445, 160, 125, 56, "onmessage", ["parse JSON", "call handler"], BLUE)
    m.oval(265, 160, 138, 58, "Zustand merge", ["book/trades/candles", "state by symbol"], BLUE)
    m.oval(90, 160, 125, 55, "UI rerender", ["chart/book/tape", "latest state"], BLUE)
    m.arrow(152, 350, 200, 318, 1, "component mounts and increments ref count", -14, (-14, 0))
    m.arrow(152, 250, 200, 282, 2, "same symbol reuses socket", 14, (-10, 0))
    m.arrow(334, 300, 382, 300, 3, "connectWS(symbol)", 0, (0, 15))
    m.arrow(507, 300, 558, 300, 4, "{type:'SUBSCRIBE', symbol}", 0, (-8, 15))
    m.arrow(625, 272, 625, 190, 5, "server immediately sends snapshots", 18, (8, 0))
    m.arrow(585, 160, 507, 160, 6, "browser receives snapshot/update", 0, (-12, 15))
    m.arrow(382, 160, 334, 160, 7, "merge by message type", 0, (0, 15))
    m.arrow(196, 160, 152, 160, 8, "React components rerender", 0, (0, 15))
    m.note(665, 95, 145, 84, "Live update sources", [
        "orderbookStream -> ORDERBOOK_DIFF.",
        "tradeStream -> TRADE_UPDATE.",
        "candleStream -> CANDLE_UPDATE.",
    ], WHITE)
    m.finish()


def page_db_state(m: Map):
    m.start("9. Durable State Ownership Map", "Which table changes in each workflow and who is allowed to change it.")
    m.oval(110, 360, 125, 55, "User.balance", ["API locks buy", "tradeWorker credits seller"], GRAY)
    m.oval(300, 360, 145, 55, "AssetBalance", ["API locks sell", "tradeWorker moves base"], GRAY)
    m.oval(500, 360, 125, 55, "Order", ["API creates", "workers update"], GRAY)
    m.oval(690, 360, 125, 55, "Trade", ["tradeWorker creates", "idempotent id"], GRAY)
    m.oval(300, 210, 125, 55, "Candle", ["candleStream upsert", "trade-derived only"], GRAY)
    m.oval(500, 210, 145, 55, "PaymentTopUp", ["checkout PENDING", "confirm/webhook COMPLETED"], GRAY)
    m.note(55, 95, 210, 80, "Order acceptance writes", [
        "placeOrderService DB tx:",
        "buy -> User.balance-- and Order.lockedQuote.",
        "sell -> AssetBalance.free-- locked++ and Order.lockedBase.",
    ], GREEN)
    m.note(315, 95, 210, 80, "Trade settlement writes", [
        "persistTrade DB tx:",
        "Trade row, both Order rows, buyer AssetBalance, seller User.balance, refunds.",
    ], GREEN)
    m.note(575, 95, 210, 80, "Read paths", [
        "Wallet reads User + AssetBalance.",
        "Activity reads Order + Trade.",
        "Chart reads Candle.",
    ], BLUE)
    m.arrow(150, 335, 455, 335, 1, "placeOrderService creates Order and locked values", 35, (-35, 20))
    m.arrow(650, 335, 545, 335, 2, "persistTrade updates order remaining/status", -20, (-16, -12))
    m.arrow(650, 335, 350, 335, 3, "persistTrade transfers base asset", -45, (-32, -8))
    m.arrow(650, 335, 155, 335, 4, "persistTrade credits seller balance/refunds buyer", -58, (-42, -15))
    m.arrow(620, 335, 330, 235, 5, "candleStream writes Candle from TRADE_EVENT", -38, (-42, 2))
    m.arrow(500, 238, 500, 330, 6, "payment top-up increments User.balance after paid", 18, (8, 0))
    m.finish()


def page_failure_debug(m: Map):
    m.start("10. Debugging By Following The Same Arrows", "Use this when UI and backend disagree.")
    m.oval(80, 350, 112, 55, "UI says order sent", ["toast / response", "OrderForm"], BLUE)
    m.oval(230, 350, 118, 55, "API logs", ["createOrder", "placeOrderService"], GREEN)
    m.oval(380, 350, 112, 55, "DB Order row", ["OPEN exists?", "funds locked?"], GRAY)
    m.oval(530, 350, 118, 55, "Redis orders", ["publish ok?", "consumer up?"], YELLOW)
    m.oval(680, 350, 118, 55, "Engine book", ["processOrder?", "book diff?"], PURPLE)
    m.oval(680, 210, 118, 55, "WS received?", ["browser console", "liveMarketStore"], BLUE)
    m.oval(530, 210, 118, 55, "DB settlement", ["tradeWorker?", "orderWorker?"], GREEN)
    m.oval(380, 210, 118, 55, "Chart/trades", ["TRADE_EVENT?", "candles?"], BLUE)
    m.arrow(136, 350, 171, 350, 1, "check Network POST /order", 0, (0, 15))
    m.arrow(289, 350, 324, 350, 2, "did DB tx commit?", 0, (0, 15))
    m.arrow(436, 350, 471, 350, 3, "did publish happen after commit?", 0, (0, 15))
    m.arrow(589, 350, 621, 350, 4, "did redisConsumer receive?", 0, (0, 15))
    m.arrow(680, 322, 680, 238, 5, "if engine processed but UI stale, inspect WS", 18, (8, 0))
    m.arrow(640, 210, 589, 210, 6, "if trade happened, inspect workers", 0, (-8, 15))
    m.arrow(471, 210, 439, 210, 7, "if chart blank, verify trade/candle path", 0, (-8, 15))
    m.note(55, 95, 220, 82, "Common conclusion", [
        "DB row exists but engine never sees it -> Redis/consumer boundary.",
        "Engine sees it but browser stale -> WS/store boundary.",
    ], WHITE)
    m.note(330, 95, 220, 82, "Blank chart", [
        "Resting orders do not create candles.",
        "Only executed trades trigger candleStream.",
    ], WHITE)
    m.note(605, 95, 190, 82, "Stale book after reset", [
        "DB reset does not clear engine memory.",
        "Restart engine to rebuild/clear snapshots.",
    ], WHITE)
    m.finish()


def page_event_contracts(m: Map):
    m.start("11. Event / Channel Contracts Map", "Who publishes, who subscribes, payload shape, and what happens next.")
    m.oval(120, 355, 120, 55, "Redis orders", ["publisher: API", "payload: Order"], YELLOW)
    m.oval(315, 355, 135, 55, "redisConsumer", ["subscriber", "calls processOrder"], PURPLE)
    m.oval(520, 355, 135, 55, "Engine events", ["eventBus local", "not Redis"], PINK)
    m.oval(720, 355, 112, 55, "WS messages", ["engine -> browser", "not Redis -> WS"], BLUE)
    m.arrow(180, 355, 247, 355, 1, "sendOrderToEngine publishes; engine consumes orders", 0, (-6, 16))
    m.arrow(382, 355, 452, 355, 2, "matching emits local events", 0, (-3, 16))
    m.arrow(588, 355, 665, 355, 3, "stream listeners broadcast to browser", 0, (-10, 16))

    m.oval(115, 230, 130, 55, "Redis cancel_orders", ["publisher: API cancel", "{orderId,symbol,userId}"], YELLOW)
    m.oval(315, 230, 135, 55, "Redis trades", ["publisher: tradePublisher", "payload: Trade"], YELLOW)
    m.oval(520, 230, 135, 55, "tradeWorker", ["subscriber to trades", "writes DB settlement"], GREEN)
    m.oval(720, 230, 112, 55, "Postgres DB", ["durable truth", "orders/trades/candles"], GRAY)
    m.arrow(180, 230, 247, 230, 4, "cancel_orders -> marketManager.cancel -> OrderBook.remove", 0, (-6, 16))
    m.arrow(382, 230, 452, 230, 5, "tradePublisher listener publishes TRADE_EVENT payload to Redis trades", 0, (-22, 16))
    m.arrow(588, 230, 665, 230, 6, "persistTrade transaction writes Trade/Order/User/AssetBalance", 0, (-18, 16))

    m.note(35, 80, 180, 90, "TRADE_EVENT", [
        "Emitter: Market.processOrder.",
        "Payload: {trade}.",
        "Listeners: tradePublisher, tradeStream, candleStream.",
    ], PINK)
    m.note(235, 80, 180, 90, "ORDER_EVENT", [
        "Emitter: Market.processOrder.",
        "Payload: {order}.",
        "Listener: orderWorker.",
        "Effect: Order.remaining/status.",
    ], PINK)
    m.note(435, 80, 180, 90, "ORDERBOOK_DIFF_EVENT", [
        "Emitter: OrderBook.emitLevelUpdate.",
        "Payload: {symbol,side,price,quantity}.",
        "Listener: orderbookStream.",
    ], PINK)
    m.note(635, 80, 170, 90, "WS message types", [
        "ORDERBOOK_SNAPSHOT / DIFF.",
        "TRADE_SNAPSHOT / UPDATE.",
        "CANDLE_SNAPSHOT / UPDATE.",
        "Receiver: liveMarketStore.",
    ], BLUE)
    m.finish()


def build():
    m = Map()
    page_whole(m)
    page_place_order(m)
    page_engine(m)
    page_trade_fanout(m)
    page_orderbook_ws(m)
    page_cancel(m)
    page_reads(m)
    page_live_subscription(m)
    page_db_state(m)
    page_failure_debug(m)
    page_event_contracts(m)
    m.save()


if __name__ == "__main__":
    build()
