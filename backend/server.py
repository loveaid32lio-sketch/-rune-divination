from fastapi import FastAPI, APIRouter, HTTPException
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
    {"id": "fehu", "symbol": "ᚠ", "name": "フェフ (Fehu)", "name_en": "Fehu", "meaning": "富・財産", "origin": "古ゲルマン語で「家畜（牛）」を意味します。遊牧時代、牛は最も重要な財産であり、富の象徴でした。ルーン文字の形は牛の角を表しています。牛を多く持つ者が豊かであったことから、「富」「繁栄」の意味が生まれました。", "upright": "物質的な豊かさ、新しい始まり、希望の実現。努力が報われる時です。", "reversed": "損失や浪費に注意。物質的な執着を手放し、本当に大切なものを見極めましょう。", "reversible": True},
    {"id": "uruz", "symbol": "ᚢ", "name": "ウルズ (Uruz)", "name_en": "Uruz", "meaning": "力・野生の牛", "origin": "絶滅した野生の大型牛「オーロックス」を指します。体高180cmにもなるこの獣は、ゲルマン民族にとって野生の力と不屈の生命力の象徴でした。若い戦士がオーロックスを倒すことは成人の通過儀礼とされ、そこから「原始的な力」「試練を経た強さ」の意味が込められました。", "upright": "内なる力と健康。困難を乗り越える強さがあなたにはあります。", "reversed": "力の使い方を誤っている可能性。弱さを認めることも強さです。", "reversible": True},
    {"id": "thurisaz", "symbol": "ᚦ", "name": "スリサズ (Thurisaz)", "name_en": "Thurisaz", "meaning": "巨人・棘", "origin": "北欧神話の巨人族「スルス（Thurs）」に由来します。また「棘（とげ）」の意味も持ちます。雷神トールのハンマーとも関連づけられ、破壊的でありながら守護的な力を表します。棘が植物を外敵から守るように、「防御の力」という側面を持っています。", "upright": "守護と防衛の力。困難な状況でも守られています。慎重に行動しましょう。", "reversed": "無防備な状態。衝動的な行動は避け、立ち止まって考える時です。", "reversible": True},
    {"id": "ansuz", "symbol": "ᚨ", "name": "アンスズ (Ansuz)", "name_en": "Ansuz", "meaning": "神・口", "origin": "主神オーディン（古ノルド語で「アース神族」）に直接結びつくルーンです。オーディンは知恵と詩、ルーン文字そのものを人間に授けた神とされます。文字の形は風になびくマントを表すとも言われ、「神の息吹＝言葉」「啓示」「知恵の伝達」を意味します。", "upright": "知恵とコミュニケーション。メッセージを受け取る時。直感を信じましょう。", "reversed": "誤解や情報の混乱。言葉を慎重に選び、よく聞くことが大切です。", "reversible": True},
    {"id": "raidho", "symbol": "ᚱ", "name": "ライゾ (Raidho)", "name_en": "Raidho", "meaning": "旅・車輪", "origin": "「乗る（ride）」「車輪」を意味するゲルマン語に由来します。古代において旅は命がけの冒険であり、同時に人生そのものの比喩でした。車輪の回転は宇宙の秩序やリズム、季節の巡りも象徴しています。文字の形はまさに前に進む人の姿を表しています。", "upright": "旅立ちと前進。正しい道を歩んでいます。リズムに乗りましょう。", "reversed": "停滞や方向転換の必要性。計画を見直す時かもしれません。", "reversible": True},
    {"id": "kenaz", "symbol": "ᚲ", "name": "ケナズ (Kenaz)", "name_en": "Kenaz", "meaning": "松明・炎", "origin": "「松明（たいまつ）」「炎」を意味します。暗闇の中で松明は唯一の光源であり、知識や理解の光を象徴しました。また、鍛冶の炉の火は「変容」と「創造」を表し、職人が原料を芸術品に変える力と結びつきます。闇の中を照らす内なる知恵の炎です。", "upright": "創造性と啓示。内なる炎が道を照らします。情熱に従いましょう。", "reversed": "創造性の枯渇や暗闇。休息を取り、インスピレーションを待ちましょう。", "reversible": True},
    {"id": "gebo", "symbol": "ᚷ", "name": "ゲボ (Gebo)", "name_en": "Gebo", "meaning": "贈り物", "origin": "「贈り物」を意味し、文字の形はX（交差）で「二者の結びつき」を表します。古代ゲルマン社会では贈与は神聖な契約であり、贈り物を受け取ることは義務を負うことを意味しました。神と人、人と人の間の互恵的な関係を象徴する、対称的で完璧なバランスのルーンです。", "upright": "贈り物と調和。与えることと受け取ることのバランス。パートナーシップの祝福。", "reversed": "", "reversible": False},
    {"id": "wunjo", "symbol": "ᚹ", "name": "ウンジョ (Wunjo)", "name_en": "Wunjo", "meaning": "喜び", "origin": "古英語「wynn（喜び・至福）」に由来します。部族の旗を表す形とも言われ、共同体に属する安心感と誇りを象徴します。厳しい北欧の自然の中で仲間と囲む暖炉、勝利の後の宴—そうした人間の根源的な幸福感がこのルーンに込められています。", "upright": "喜びと幸福。願いが叶う時。調和と満足感に包まれています。", "reversed": "幸福感の欠如。期待と現実のギャップ。感謝の気持ちを思い出しましょう。", "reversible": True},
    {"id": "hagalaz", "symbol": "ᚺ", "name": "ハガラズ (Hagalaz)", "name_en": "Hagalaz", "meaning": "雹", "origin": "「雹（ひょう）」を意味します。北欧の厳しい気候の中で、雹は突然の破壊をもたらす自然の力でした。しかし雹は溶けて水となり、大地を潤します。このルーンは「制御できない力」でありながら、破壊の後の再生を約束する「浄化」の象徴でもあります。", "upright": "突然の変化や試練。しかしこれは浄化のプロセス。嵐の後に虹が現れます。", "reversed": "", "reversible": False},
    {"id": "nauthiz", "symbol": "ᚾ", "name": "ナウシズ (Nauthiz)", "name_en": "Nauthiz", "meaning": "必要・制約", "origin": "「必要」「欠乏」を意味します。文字の形は火起こし棒を交差させる姿を表しています。厳冬の中、火を起こすことは生存のための「必死の行為」でした。最も困窮した状況からこそ人は工夫し、革新を生み出す—「必要は発明の母」という知恵がこのルーンに宿っています。", "upright": "困難と制約。しかし必要な試練です。忍耐が内なる強さを育てます。", "reversed": "自分自身を制限しすぎています。恐れを手放し、一歩踏み出しましょう。", "reversible": True},
    {"id": "isa", "symbol": "ᛁ", "name": "イサ (Isa)", "name_en": "Isa", "meaning": "氷", "origin": "「氷」を意味する最もシンプルなルーン—一本の縦線です。北欧の凍結した世界を象徴し、全てが停止する「静寂の力」を表します。北欧神話では世界の始まりは氷（ニヴルヘイム）と炎（ムスペルヘイム）の出会いから生まれました。氷は「可能性を内に秘めた静止状態」なのです。", "upright": "停止と静寂。今は動く時ではありません。静かに内省し、時を待ちましょう。", "reversed": "", "reversible": False},
    {"id": "jera", "symbol": "ᛃ", "name": "イェラ (Jera)", "name_en": "Jera", "meaning": "収穫・年", "origin": "「年」「収穫」を意味し、英語の「year」の語源です。文字の形は二つの半分が噛み合う様子で、季節の循環を表しています。種を蒔き、忍耐強く育て、やがて実りを得る—この自然の法則は「正しい時に正しい報いがある」という宇宙的な正義を象徴しています。", "upright": "収穫の時。これまでの努力が実を結びます。自然のサイクルを信じましょう。", "reversed": "", "reversible": False},
    {"id": "eihwaz", "symbol": "ᛇ", "name": "エイワズ (Eihwaz)", "name_en": "Eihwaz", "meaning": "イチイの木", "origin": "「イチイの木」を意味します。イチイは常緑樹で寿命が数千年にもなり、「死と再生」の象徴でした。その木材は弓に使われ「死を与える力」を持つ一方、墓地に植えられ「永遠の生命」も象徴しました。世界樹ユグドラシルとも関連し、生と死を繋ぐ軸を表しています。", "upright": "変容と再生。終わりと始まりの間。古いものを手放し、新しい自分になりましょう。", "reversed": "", "reversible": False},
    {"id": "perthro", "symbol": "ᛈ", "name": "ペルスロ (Perthro)", "name_en": "Perthro", "meaning": "運命・秘密", "origin": "最も謎に包まれたルーンです。「サイコロ杯」「くじ引きの器」を表すとされ、運命を占う器具の形に見えます。古代ゲルマン人はくじ（ロット）を引いて運命を読み取りました。まさにこのルーン占い自体の源流を象徴する—「隠された法則」「運命の織物」のルーンです。", "upright": "神秘と運命。隠された真実が明らかになります。直感を大切にしましょう。", "reversed": "予期せぬ展開。秘密や隠し事に注意。真実を求めましょう。", "reversible": True},
    {"id": "algiz", "symbol": "ᛉ", "name": "アルギズ (Algiz)", "name_en": "Algiz", "meaning": "保護・ヘラジカ", "origin": "「ヘラジカ」または「スゲ草」を意味します。文字の形は両手を天に掲げる人の姿—神々に守護を求める祈りの姿勢を表します。また、ヘラジカの枝角は外敵から身を守る武器です。ヴァルキューレ（戦場の守護女神）とも結びつけられ、最も強力な「守護」のルーンとされています。", "upright": "神聖な保護。あなたは守られています。直感に従い、危険を避けましょう。", "reversed": "防御が弱まっています。自分の境界を見直し、注意深く行動しましょう。", "reversible": True},
    {"id": "sowilo", "symbol": "ᛊ", "name": "ソウィロ (Sowilo)", "name_en": "Sowilo", "meaning": "太陽", "origin": "「太陽」を意味し、英語の「Sun」「Solar」の語源に繋がります。稲妻の形をしたこのルーンは、天から降り注ぐ生命のエネルギーを表します。北欧の長い冬を経た後の太陽の帰還は、まさに「勝利」そのものでした。暗闇に打ち勝つ光の力、意志の輝きを象徴しています。", "upright": "成功と勝利。太陽のエネルギーがあなたを照らしています。自信を持って進みましょう。", "reversed": "", "reversible": False},
    {"id": "tiwaz", "symbol": "ᛏ", "name": "ティワズ (Tiwaz)", "name_en": "Tiwaz", "meaning": "戦いの神テュール", "origin": "軍神テュール（Tyr）に捧げられたルーンです。テュールは秩序を守るため、巨大な狼フェンリルを繋ぐ際に自ら片手を犠牲にした神です。文字の形は矢印（↑）で「天を指す意志」を表します。個人の利益より大義のために犠牲を払う—「真の勇気と正義」のルーンです。", "upright": "正義と勇気。正しいことのために立ち上がる時。信念を貫きましょう。", "reversed": "不正義や臆病。自分の信念を見失っていませんか？勇気を取り戻しましょう。", "reversible": True},
    {"id": "berkano", "symbol": "ᛒ", "name": "ベルカノ (Berkano)", "name_en": "Berkano", "meaning": "白樺・誕生", "origin": "「白樺の木」を意味し、英語の「birch」の語源です。白樺は春に最も早く芽吹く樹木で、「新しい生命」の象徴でした。文字の形は妊婦の横顔、あるいは乳房を表すとも言われます。母性、豊穣、そして大地の女神フレイヤの祝福を宿す「誕生」のルーンです。", "upright": "新しい始まりと成長。優しさと養育の力。新しい生命やプロジェクトの誕生。", "reversed": "成長の停滞。自分自身をケアする必要があります。焦らず、根を張りましょう。", "reversible": True},
    {"id": "ehwaz", "symbol": "ᛖ", "name": "エワズ (Ehwaz)", "name_en": "Ehwaz", "meaning": "馬・移動", "origin": "「馬」を意味し、英語の「equine」に繋がります。古代ゲルマン社会で馬は単なる移動手段ではなく、人間の忠実なパートナーでした。オーディンの八本脚の馬スレイプニルは世界を駆け巡りました。このルーンは「信頼に基づく協力関係」と「共に前進する力」を象徴しています。", "upright": "進歩と信頼関係。パートナーと共に前進する力。変化を受け入れましょう。", "reversed": "信頼の問題や移動の困難。関係性を見直す時かもしれません。", "reversible": True},
    {"id": "mannaz", "symbol": "ᛗ", "name": "マンナズ (Mannaz)", "name_en": "Mannaz", "meaning": "人間", "origin": "「人間」を意味し、英語の「man」の語源です。北欧神話では最初の人間アスクとエンブラが二本の流木から創られました。文字の形は二人が向き合う姿で、「自己」と「他者」の関係を表します。人間の知性、社会性、そして「汝自身を知れ」という自己認識のルーンです。", "upright": "自己理解と人間関係。他者との協力が成功の鍵。自分自身を知りましょう。", "reversed": "孤立や自己欺瞞。他者の助けを受け入れ、素直になりましょう。", "reversible": True},
    {"id": "laguz", "symbol": "ᛚ", "name": "ラグズ (Laguz)", "name_en": "Laguz", "meaning": "水・湖", "origin": "「水」「湖」「海」を意味し、英語の「lake」の語源です。文字の形は流れ落ちる水滴、または波を表しています。ゲルマン民族にとって海は未知の世界への入口であり、生命の源でもありました。意識の深層、夢、直感—目に見えない心の流れを象徴するルーンです。", "upright": "直感と感情の流れ。深層意識からのメッセージ。流れに身を任せましょう。", "reversed": "感情の混乱や恐れ。深い感情に向き合う勇気を持ちましょう。", "reversible": True},
    {"id": "ingwaz", "symbol": "ᛝ", "name": "イングワズ (Ingwaz)", "name_en": "Ingwaz", "meaning": "豊穣の神", "origin": "豊穣神イング（フレイ）に捧げられたルーンです。文字の形は「種子」または「卵」を表し、まだ外に現れていない内なる可能性を象徴します。土の中で静かに発芽を待つ種のように、適切な時が来れば必ず花開く—そんな「潜在する完成」のルーンです。", "upright": "完成と成就。一つのサイクルが完了し、新たな段階へ。内なる種が芽吹きます。", "reversed": "", "reversible": False},
    {"id": "dagaz", "symbol": "ᛞ", "name": "ダガズ (Dagaz)", "name_en": "Dagaz", "meaning": "夜明け・日", "origin": "「日」「夜明け」を意味し、英語の「day」の語源です。文字の形は砂時計のような無限のループで、夜と昼の絶え間ない循環を表しています。最も暗い夜の直後に必ず夜明けが来る—この宇宙的な約束を象徴する、希望と覚醒のルーンです。", "upright": "覚醒と変容。夜明けが来ています。大きな突破口とポジティブな変化。", "reversed": "", "reversible": False},
    {"id": "othala", "symbol": "ᛟ", "name": "オサラ (Othala)", "name_en": "Othala", "meaning": "故郷・遺産", "origin": "「先祖代々の土地」「遺産」を意味します。古代ゲルマン社会で土地は売買できない神聖なものであり、血族を通じて受け継がれました。文字の形は囲われた土地（家）を表しています。物質的な遺産だけでなく、祖先の知恵や精神的な伝統—「魂のルーツ」を象徴しています。", "upright": "遺産と伝統。ルーツとのつながり。家族や祖先からの祝福を受けています。", "reversed": "ルーツからの切断。古い習慣を手放す必要。新しいホームを見つけましょう。", "reversible": True},
    {"id": "blank", "symbol": "☽", "name": "ウィルド (Wyrd)", "name_en": "Wyrd (Blank Rune)", "meaning": "運命・未知", "origin": "空白のルーンは古代には存在せず、1980年代にラルフ・ブラムによって追加されました。「ウィルド」は古英語で「運命」「宿命」を意味し、北欧神話の運命の女神ノルン三姉妹が織る「運命の織物」と関連します。刻印のない石は「まだ何も書かれていない」可能性そのもの—未知なる運命の白紙を象徴しています。", "upright": "無限の可能性。運命は白紙であり、あなた自身が書き込むものです。全てはあなた次第。宇宙を信頼しましょう。", "reversed": "", "reversible": False},
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
    rune_origin: str
    interpretation: str
    timestamp: str

class DrawResponse(BaseModel):
    rune_id: str
    position: str
    symbol: str
    name: str
    meaning: str
    origin: str
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
        origin=rune["origin"],
        interpretation=interpretation,
    )

@api_router.post("/readings", response_model=ReadingResponse)
async def save_reading(reading: ReadingCreate):
    """Save a reading to history"""
    rune = next((r for r in RUNES if r["id"] == reading.rune_id), None)
    if not rune:
        raise HTTPException(status_code=400, detail="Rune not found")
    
    interpretation = rune["upright"] if reading.position == "upright" else rune["reversed"]
    
    reading_doc = {
        "id": str(uuid.uuid4()),
        "rune_id": reading.rune_id,
        "position": reading.position,
        "rune_symbol": rune["symbol"],
        "rune_name": rune["name"],
        "rune_meaning": rune["meaning"],
        "rune_origin": rune["origin"],
        "interpretation": interpretation,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    
    await db.readings.insert_one(reading_doc)
    
    return ReadingResponse(**{k: v for k, v in reading_doc.items() if k != "_id"})

@api_router.get("/readings", response_model=List[ReadingResponse])
async def get_readings():
    """Get all readings history"""
    readings = await db.readings.find({}, {"_id": 0}).sort("timestamp", -1).to_list(100)
    result = []
    for r in readings:
        if "rune_origin" not in r:
            rune = next((ru for ru in RUNES if ru["id"] == r.get("rune_id")), None)
            r["rune_origin"] = rune["origin"] if rune else ""
        result.append(ReadingResponse(**r))
    return result

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
