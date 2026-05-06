from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import random

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

# Elder Futhark Runes Data (25 including blank)
RUNES = [
    {"id": "fehu", "symbol": "ᚠ", "name": "フェフ (Fehu)", "name_en": "Fehu", "meaning": "富・財産", "upright": "物質的な豊かさ、新しい始まり、希望の実現。努力が報われる時です。", "reversed": "損失や浪費に注意。物質的な執着を手放し、本当に大切なものを見極めましょう。", "reversible": True},
    {"id": "uruz", "symbol": "ᚢ", "name": "ウルズ (Uruz)", "name_en": "Uruz", "meaning": "力・野生の牛", "upright": "内なる力と健康。困難を乗り越える強さがあなたにはあります。", "reversed": "力の使い方を誤っている可能性。弱さを認めることも強さです。", "reversible": True},
    {"id": "thurisaz", "symbol": "ᚦ", "name": "スリサズ (Thurisaz)", "name_en": "Thurisaz", "meaning": "巨人・棘", "upright": "守護と防衛の力。困難な状況でも守られています。慎重に行動しましょう。", "reversed": "無防備な状態。衝動的な行動は避け、立ち止まって考える時です。", "reversible": True},
    {"id": "ansuz", "symbol": "ᚨ", "name": "アンスズ (Ansuz)", "name_en": "Ansuz", "meaning": "神・口", "upright": "知恵とコミュニケーション。メッセージを受け取る時。直感を信じましょう。", "reversed": "誤解や情報の混乱。言葉を慎重に選び、よく聞くことが大切です。", "reversible": True},
    {"id": "raidho", "symbol": "ᚱ", "name": "ライゾ (Raidho)", "name_en": "Raidho", "meaning": "旅・車輪", "upright": "旅立ちと前進。正しい道を歩んでいます。リズムに乗りましょう。", "reversed": "停滞や方向転換の必要性。計画を見直す時かもしれません。", "reversible": True},
    {"id": "kenaz", "symbol": "ᚲ", "name": "ケナズ (Kenaz)", "name_en": "Kenaz", "meaning": "松明・炎", "upright": "創造性と啓示。内なる炎が道を照らします。情熱に従いましょう。", "reversed": "創造性の枯渇や暗闇。休息を取り、インスピレーションを待ちましょう。", "reversible": True},
    {"id": "gebo", "symbol": "ᚷ", "name": "ゲボ (Gebo)", "name_en": "Gebo", "meaning": "贈り物", "upright": "贈り物と調和。与えることと受け取ることのバランス。パートナーシップの祝福。", "reversed": "", "reversible": False},
    {"id": "wunjo", "symbol": "ᚹ", "name": "ウンジョ (Wunjo)", "name_en": "Wunjo", "meaning": "喜び", "upright": "喜びと幸福。願いが叶う時。調和と満足感に包まれています。", "reversed": "幸福感の欠如。期待と現実のギャップ。感謝の気持ちを思い出しましょう。", "reversible": True},
    {"id": "hagalaz", "symbol": "ᚺ", "name": "ハガラズ (Hagalaz)", "name_en": "Hagalaz", "meaning": "雹", "upright": "突然の変化や試練。しかしこれは浄化のプロセス。嵐の後に虹が現れます。", "reversed": "", "reversible": False},
    {"id": "nauthiz", "symbol": "ᚾ", "name": "ナウシズ (Nauthiz)", "name_en": "Nauthiz", "meaning": "必要・制約", "upright": "困難と制約。しかし必要な試練です。忍耐が内なる強さを育てます。", "reversed": "自分自身を制限しすぎています。恐れを手放し、一歩踏み出しましょう。", "reversible": True},
    {"id": "isa", "symbol": "ᛁ", "name": "イサ (Isa)", "name_en": "Isa", "meaning": "氷", "upright": "停止と静寂。今は動く時ではありません。静かに内省し、時を待ちましょう。", "reversed": "", "reversible": False},
    {"id": "jera", "symbol": "ᛃ", "name": "イェラ (Jera)", "name_en": "Jera", "meaning": "収穫・年", "upright": "収穫の時。これまでの努力が実を結びます。自然のサイクルを信じましょう。", "reversed": "", "reversible": False},
    {"id": "eihwaz", "symbol": "ᛇ", "name": "エイワズ (Eihwaz)", "name_en": "Eihwaz", "meaning": "イチイの木", "upright": "変容と再生。終わりと始まりの間。古いものを手放し、新しい自分になりましょう。", "reversed": "", "reversible": False},
    {"id": "perthro", "symbol": "ᛈ", "name": "ペルスロ (Perthro)", "name_en": "Perthro", "meaning": "運命・秘密", "upright": "神秘と運命。隠された真実が明らかになります。直感を大切にしましょう。", "reversed": "予期せぬ展開。秘密や隠し事に注意。真実を求めましょう。", "reversible": True},
    {"id": "algiz", "symbol": "ᛉ", "name": "アルギズ (Algiz)", "name_en": "Algiz", "meaning": "保護・ヘラジカ", "upright": "神聖な保護。あなたは守られています。直感に従い、危険を避けましょう。", "reversed": "防御が弱まっています。自分の境界を見直し、注意深く行動しましょう。", "reversible": True},
    {"id": "sowilo", "symbol": "ᛊ", "name": "ソウィロ (Sowilo)", "name_en": "Sowilo", "meaning": "太陽", "upright": "成功と勝利。太陽のエネルギーがあなたを照らしています。自信を持って進みましょう。", "reversed": "", "reversible": False},
    {"id": "tiwaz", "symbol": "ᛏ", "name": "ティワズ (Tiwaz)", "name_en": "Tiwaz", "meaning": "戦いの神テュール", "upright": "正義と勇気。正しいことのために立ち上がる時。信念を貫きましょう。", "reversed": "不正義や臆病。自分の信念を見失っていませんか？勇気を取り戻しましょう。", "reversible": True},
    {"id": "berkano", "symbol": "ᛒ", "name": "ベルカノ (Berkano)", "name_en": "Berkano", "meaning": "白樺・誕生", "upright": "新しい始まりと成長。優しさと養育の力。新しい生命やプロジェクトの誕生。", "reversed": "成長の停滞。自分自身をケアする必要があります。焦らず、根を張りましょう。", "reversible": True},
    {"id": "ehwaz", "symbol": "ᛖ", "name": "エワズ (Ehwaz)", "name_en": "Ehwaz", "meaning": "馬・移動", "upright": "進歩と信頼関係。パートナーと共に前進する力。変化を受け入れましょう。", "reversed": "信頼の問題や移動の困難。関係性を見直す時かもしれません。", "reversible": True},
    {"id": "mannaz", "symbol": "ᛗ", "name": "マンナズ (Mannaz)", "name_en": "Mannaz", "meaning": "人間", "upright": "自己理解と人間関係。他者との協力が成功の鍵。自分自身を知りましょう。", "reversed": "孤立や自己欺瞞。他者の助けを受け入れ、素直になりましょう。", "reversible": True},
    {"id": "laguz", "symbol": "ᛚ", "name": "ラグズ (Laguz)", "name_en": "Laguz", "meaning": "水・湖", "upright": "直感と感情の流れ。深層意識からのメッセージ。流れに身を任せましょう。", "reversed": "感情の混乱や恐れ。深い感情に向き合う勇気を持ちましょう。", "reversible": True},
    {"id": "ingwaz", "symbol": "ᛝ", "name": "イングワズ (Ingwaz)", "name_en": "Ingwaz", "meaning": "豊穣の神", "upright": "完成と成就。一つのサイクルが完了し、新たな段階へ。内なる種が芽吹きます。", "reversed": "", "reversible": False},
    {"id": "dagaz", "symbol": "ᛞ", "name": "ダガズ (Dagaz)", "name_en": "Dagaz", "meaning": "夜明け・日", "upright": "覚醒と変容。夜明けが来ています。大きな突破口とポジティブな変化。", "reversed": "", "reversible": False},
    {"id": "othala", "symbol": "ᛟ", "name": "オサラ (Othala)", "name_en": "Othala", "meaning": "故郷・遺産", "upright": "遺産と伝統。ルーツとのつながり。家族や祖先からの祝福を受けています。", "reversed": "ルーツからの切断。古い習慣を手放す必要。新しいホームを見つけましょう。", "reversible": True},
    {"id": "blank", "symbol": "☽", "name": "ウィルド (Wyrd)", "name_en": "Wyrd (Blank Rune)", "meaning": "運命・未知", "upright": "無限の可能性。運命は白紙であり、あなた自身が書き込むものです。全てはあなた次第。宇宙を信頼しましょう。", "reversed": "", "reversible": False},
]

# Models
class ReadingCreate(BaseModel):
    rune_id: str
    position: str  # "upright" or "reversed"

class ReadingResponse(BaseModel):
    id: str
    rune_id: str
    position: str
    rune_symbol: str
    rune_name: str
    rune_meaning: str
    interpretation: str
    timestamp: str

class DrawResponse(BaseModel):
    rune_id: str
    position: str
    symbol: str
    name: str
    meaning: str
    interpretation: str

# Routes
@api_router.get("/")
async def root():
    return {"message": "Rune Divination API"}

@api_router.get("/runes")
async def get_runes():
    return RUNES

@api_router.post("/draw")
async def draw_rune():
    """Draw a random rune"""
    rune = random.choice(RUNES)
    # Determine position (upright or reversed)
    if rune["reversible"]:
        position = random.choice(["upright", "reversed"])
    else:
        position = "upright"
    
    interpretation = rune["upright"] if position == "upright" else rune["reversed"]
    
    return DrawResponse(
        rune_id=rune["id"],
        position=position,
        symbol=rune["symbol"],
        name=rune["name"],
        meaning=rune["meaning"],
        interpretation=interpretation,
    )

@api_router.post("/readings", response_model=ReadingResponse)
async def save_reading(reading: ReadingCreate):
    """Save a reading to history"""
    rune = next((r for r in RUNES if r["id"] == reading.rune_id), None)
    if not rune:
        return {"error": "Rune not found"}
    
    interpretation = rune["upright"] if reading.position == "upright" else rune["reversed"]
    
    reading_doc = {
        "id": str(uuid.uuid4()),
        "rune_id": reading.rune_id,
        "position": reading.position,
        "rune_symbol": rune["symbol"],
        "rune_name": rune["name"],
        "rune_meaning": rune["meaning"],
        "interpretation": interpretation,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    
    await db.readings.insert_one(reading_doc)
    
    return ReadingResponse(**{k: v for k, v in reading_doc.items() if k != "_id"})

@api_router.get("/readings", response_model=List[ReadingResponse])
async def get_readings():
    """Get all readings history"""
    readings = await db.readings.find({}, {"_id": 0}).sort("timestamp", -1).to_list(100)
    return [ReadingResponse(**r) for r in readings]

@api_router.delete("/readings")
async def clear_readings():
    """Clear all readings history"""
    await db.readings.delete_many({})
    return {"message": "All readings cleared"}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
