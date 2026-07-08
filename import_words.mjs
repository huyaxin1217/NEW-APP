import { initializeApp } from "firebase/app";
import { getFirestore, collection, writeBatch, doc } from "firebase/firestore";
import fs from "fs";

const text = `
initially ad.最初，开始 makeup n.组织；性格；化装品
rmost a.最外面的，最远的 optimum n.最适条件，最适度
block n.阻塞；障碍物； 炮闩 damn vt.诅咒 n.诅咒；丝毫
outeintegral a.组成的；整的 composition n.组成，构成，结构
value vt.尊重，重视，评价 dignity a.尊贵；(举止)庄严
grunt vi.作呼噜声；咕哝 abide vt.遵守 vt.忍受
composer n.作曲家；调停人 slave vi.作苦工 vt.奴役
resultant a.作为结果而发生的 consequent a.作为结果的；必然的
hike vi.作长途徒步旅行 action n.作用；情节
trade vi.做买卖；交换 deal vi.做买卖；对付
lease n.租约，契约，租契 charter vt.租 n.宪章；契据
headquarters n.总局，总店 executive n.总经理，董事
main n.总管道，干线 overall a.综合的 n.工作服
conceitn.自负，自高自大 ultraviolet a.紫外的 n.紫外线辐射
descendant n.子孙，后裔；弟子 endow vt.资助；赋予，授予
datum n.资料；数据；已知数 qualification n.资格；限制条件
bourgeois a.资产阶级的；平庸的 woodpecker n.啄木鸟
bump vt.撞击 vi.撞 n.肿块 crash vi.撞坏，摔坏，砸碎
way n.状态，状况，规模 superba.壮丽的；超等的
ornament n.装饰物 vt.装修 decorative a.装饰的；可作装饰的
ornamental a.装饰的 n.装饰品 mount v.装配；固定 n.支架
shipment n.装货；装载的货物 can vt.装罐头
array vt.装扮 n.队列；排列 diversion n.转移；改道；娱乐
convert vt.转变，改变，变换 transition n.转变，变迁；过渡
torque n.转(力)矩，扭(力)矩 workshop n.专题讨论会
patent a.专利的 n.专利 clutch vt.抓住 vi.掌握，攫
nest vi.筑巢 vt.为…筑巢 coin vt.铸造(硬币)
noted a.著名的，知名的 watchful a.注意的，警惕的
inject vt.注射；注满；喷射 storage n.贮藏，保管；仓库
position n.主张，立场；形势 metropolitan a.主要都市的 n.大主教
principallyad.主要，大抵 stalk n.主茎，叶柄；高烟囱
preside vi.主持；主奏 eject vt.逐出，排斥；喷射
bamboo n.竹；竹杆，竹棍 jewellery n.珠宝，珠宝饰物
wrinkle n.皱纹 vt.使起皱纹 axial a.轴的；轴向的
axis n.轴，轴线；第二颈椎 ambient a.周围的，包围着
anniversary n.周年纪念日 peripheral a.周界的；末梢的
perimeter n.周(边)，周长 anybody n.重要人物
responsible a.重要的；可靠的 consequence n.重要(性)，重大意义
category n.种类，类目；范畴 species n.种，物种；种类
hearty a.衷心的；丰盛的 neutron n.中子
intermediate n.中间体；调解人 proton n.质子，氕核
qualitativea.质的；定性的 fabricate vt.制作，组合；捏造
fabrication n.制作，构成；捏造 volunteer n.志愿者 vt.志愿
rebukevt.指责，非难，斥责 indicative a.指示的；陈述的
denote vt.指示，意味着 instructor n.指导者，教员
designate vt.指出，指示；指定 colonial a.殖民地的，殖民的
vocation n.职业，行业 notable n.值得注意的；著名的
merit vt.值得 vi.应受赏(罚) weavern.织布工，编织者
brace n.支柱 vt.拉紧，撑牢 check n.支票，帐单
symptom n.症状，征候，征兆 regime n.政体，政权；制度
secondvt.支持 bearing n.支承；忍受；方位
politicsn.政纲，政见，策略 platform n.政纲，党纲，宣言
confirmation n.证实，确定；确认 testify v.证明，证实，作证
audience n.正式会见；拜会 correctly ad.正确地，恰当地
positive a.正的；阳性的 normalization n.正常化，标准化
sign n.征兆，迹象，病症 conqueror n.征服者，胜利者
controversy n.争论，辩论，争吵 suppress vt.镇压；抑制；隐瞒
gust n.阵风，一阵狂风 clinic n.诊所，医务室；会诊
diagnose vt.诊断(疾病) sincerity n.真诚，诚意；真实
cherish vt.珍爱；怀有(感情) detective n.侦探，密探
underline vt.着重；预告 grind vt.折磨，压榨
discount n.折扣；打折扣卖 literally ad.照字义，逐字地
illuminate vt.照明，照亮；阐明 summon vt.召唤；鼓起(勇气)
marsh n.沼泽地，湿地 entertainmentn.招待，招待会
hindrance n.障碍，妨碍 hose n.长筒袜；软管
sofa n.长沙发，沙发 tensile a.张力的；能伸长的
warfare n.战争，战争状态 battle vi.战斗 vt.与…作战
predominant a.占优势的；主要的 unfold vt.展开 vi.呈现
cling vi.粘住；依附；坚持 viscous a.粘滞的，粘性的
coherent a.粘着的；紧凑的 album n.粘贴簿；相册；文选
glue vt.粘牢 cement vt.粘结 vi.粘紧
adhere vi.粘附；追随；坚持 strip n.窄条，长带
furthervt.增进 multiplication n.增加；繁殖；乘法
liability n.责任；倾向；债务 shipbuilding n.造船(业)，造船学
grasshopper n.蚱蜢，蝗虫，蚂蚱 wink vi.眨眼；使眼色
mint n.造币厂；巨额，富源 hollow vt.凿空 vi.变空
hymn n.赞美诗，圣歌；赞歌 glorify vt.赞美(上帝)；颂扬
fore ad.在前面 a.先前的 thereinad.在那里，在那时
overseas ad.在海外，(向)国外 ashore ad.在岸上，上岸
outside prep.在…外，向…外 brand vt.在…上打烙印
alongside prep.在…旁边 Roam vt.在…漫步，漫游
over prep.在(做)…时 reproduction n.再生(产)；繁殖
operation n.运算 freight n.运费；货运；负担
specification n.载明，详述；规格 disastrousa.灾难性的；悲惨的
locomotivea.运动的；机动 lunar a.月亮的
dome n.圆屋顶，拱顶 cylinder n.圆筒；柱(面)；汽缸
undertake vt.约定，保证；从事 primitive a.远古的，未开化的
prototype n.原型；典型，范例 vowel n.元音；元音字母
satisfactorily ad.圆满地 nucleus n.原子核；细胞核
marshal n.元帅；陆军元帅 subscription n.预约，用户，订阅费
prophet n.预言家，先知 prophecy n.预言，预言能力
prediction n.预言，预告；预报 preset vt.预先装置
beforehand ad.预先；提前地 budgetn.预算，预算案
foreseevt.预见，预知，看穿 preventionn.预防，阻止，妨碍
tulip n.郁金香 intonation n.语调，声调；发声
cosmica.宇宙的；广大无边的 cosmos n.宇宙；秩序，和谐
overlap vt.与…交搭 vi.重迭 excuse vt.与…辩解；使免除
senseless a.愚蠢的，无意义的 amusement n.娱乐，消遣，乐趣
torpedo n.鱼雷，水雷 marginn.余地；幅度；赚头
roundabout a.迂回的；转弯抹角的 kidnapvt.诱拐，绑架
guilt n.有罪，犯罪；内疚 shadowy a.有影的；幽暗的
avail vt.有益于 n.效用 ambitious a.有雄心的；热望的
significant a.有效的 validity n.有效，效力；正确
availability n.有效(性)；可得性 finite a.有限的；有尽的
magnet n.有吸引力的人(或物 profitable a.有利的；有益的
advantageous a.有利的，有助的 courteous a.有礼貌的，谦恭的
bead n.有孔小珠；露珠 commonsensea.有常识的
conservative a.有保存力的，防腐的 liable a.有(法律)责任的
yacht n.游艇，快艇 uranium n.铀
tanker n.油船；空中加油飞机 postal a.邮政的，邮局的
superiority n.优越(性)，优势 elbow vt.用肘挤，挤进
paper vt.用纸包装(或覆盖) cutter n.用于切割的器械
net vt.用网捕；用网覆盖 head vt.用头顶(球)vi.出发
tug vi.用力拖 n.猛拉，拖 hook vt.用钩连接，用钩挂
formulate vt.用公式表示 sniff vi.用鼻子吸 vt.嗅
courageous a.勇敢的，无畏的 emigrate vi.永久移居国外
perpetual a.永久的；四季开花的 everlasting a.永久的；持久的
periodic n.周期的；一定时期的 stiffness n.硬度
complyvi.应允，遵照，照做 bound a.应当的；必定的
salute vt.迎接，欢迎 cater vi.迎合，投合
press n.印刷机，印刷所 printern.印刷工；印花工
harbour vt.隐匿，窝藏；怀着 eternaln.永久的；不朽的
tempt vt.引诱，诱惑，劝诱 citevt.引用，引证；举例
ignite vt.引燃 vi.着火 derivation n.引出；起源；衍生
bankern.银行家 obscure a.阴暗的；蒙昧的
inasmuch ad.因为，由于 through prep.因为，由于
observation n.意见，短评，按语 consciousness n.意识，知觉，觉悟
cross a.易怒的；杂交的 refrain vi.抑制，制止，忍住
restrain vt.抑制，制止，遏制 singular a.异常的，奇异的
house n.议院，会议厅 obligation n.义务，职责，责任
formerly ad.以前，从前 desert vt.遗弃；擅离(职守)
transmission n.遗传，传染 veilvt.以面纱遮掩 vi.遮盖
forsake vt.遗弃，抛弃，摒绝 displace vt.移置；取代；置换
displacement n.移置；免职；置换 garment n.衣服；服装，衣着
colonist n.移民；殖民地居民 Islam n.伊斯兰教，回教
instrumental a.仪器的；有帮助的 evenly ad.一致地，平静地
wardrobe n.衣柜，衣橱，藏衣室 compatible a.一致的；兼容制的
stitch n.一针，缝线 vt.缝 concert n.一齐，一致，协作
chop n.一块排骨，肉块 baby n.一家中年龄最小的人
troop n.一群，一队，大量 episode n.一段情节；插曲
clustern.一串 vt.使成群 generalization n.一般化；概括，综合
burglar n.夜盗，窃贼 amateur a.业余的 n.业余爱好者
Jesus n.耶稣 metallurgyn.冶金学，冶金术
fortn.要塞，堡垒 prescription n.药方，处方的药
postulate vt.要求，假定，假设 wag vt.摇，摇摆，摆动
cradle n.摇篮，发源地 oxide n.氧化物
waver vi.摇摆；犹豫不决 domestic a.养在家里的
oxidize vt.氧化，使生锈 banquet n.宴会，盛会，酒席
foster vt.养育，抚养；培养 anode n.阳极，正极，板极
balcony n.阳台；楼厅，楼座 scope n.眼界
proverb n.谚语，格言，箴言 cloak vt.掩盖，覆盖，掩饰
prolong vt.延长，拉长，拖延 sharply ad.严厉地，苛刻地
pickle n.腌制食品，泡菜 squash vt.压碎 n.鲜果汁
retard vt.延迟，放慢 squeeze n.压榨；榨取，佣金
dentistn.牙科医生 overwhelming a.压倒的，势不可挡的
opium n.鸦片；麻醉剂 overwhelmvt.压倒，使不知所措
deposit n.押金；寄存物 velocity n.迅速，快速
compression n.压缩，压紧，浓缩 patrol n.巡逻 n.巡逻，巡查
circulationn.循环；(货币等)流通 scholarship n.学问，学识；奖学金
cruise vi.巡航 vt.巡航于… option n.选择，取舍
cigar n.雪茄烟，叶卷烟 cock n.旋塞，开关，龙头
quest vt.寻找 vi.追求 melodyn.旋律，曲调；歌曲
radiant a.绚丽的；容光焕发的 gorgeous a.绚丽的；极好的
overhang vt.悬于…之上 vi.悬垂 narration n.叙述；故事；叙述法
propaganda n.宣传；宣传机构 warrant n.许可证，委任状
console n.悬臂，肘托；控制台 declaration n.宣布，宣言；申诉
sequence n.序列 nun n.修女，尼姑
embroidery n.绣花，刺绣；绣制品 eloquence n.雄辩；口才，修辞
requisite a.需要的 n.必需品 pacific a.性情温和的
survival n.幸存，残存；幸存者 flush n.兴奋，脸红；发烧
wind n.胸口，心窝 formal a.形态的；规范的
directory n.姓名地址录；董事会 constituent a.形成的 n.选民
scarlet n.猩红色 a.猩红的 regenerative a.新生的；回授的
religion n.信念，信条 appreciation n.欣赏；鉴别；感激
noveltyn.新颖；新奇的事物 psychology n.心理学；心理
bridegroom n.新郎 zinc n.锌 vt.在…上镀锌
novel a.新的，异常的 jean n.斜纹布，牛仔裤
crab n.蟹，蟹肉 vi.捕蟹 gradient n.斜坡 a.倾斜的
subscript a.写在下方的 n.下标 eviln.邪恶，罪恶；祸害
sideways ad.斜向一边地 collaborate vi.协作，合作；协调
viciousa.邪恶的；恶性的 team vi.协作，合作
coefficient n.协同因素；系数，率 wedge n.楔 vt.楔入；挤入
calibrationn.校准；标定，刻度 cautious a.小心的，谨慎的
paragraph n.小新闻，短评 caution n.小心；告诫 vt.警告
suitcase n.小提箱，衣箱 decimal a.小数的，十进制的
puppy n.小狗；幼小的动物 footpath n.小路，人行道
closet n.小房间；壁碗橱 pamphlet n.小册子
disappearance n.消失，消散；失踪 recreation n.消遣，娱乐活动
slack a.萧条的；懈怠的 consumption n.消费(量)，灭绝
consumer n.消费者，用户 token n.象征；辅币；纪念品
depression n.消沉；不景气萧条期 forward ad.向前，将来 vt.转递
ivory n.象牙；牙质；乳白色 onward(s) a.向前(的)，在前面
orientation n.向东；定位；方向 defy vt.向…挑战；蔑视
southwards ad.向南方 northward(s) ad.向北方 a.向北的
yearn vi.想念，怀念，向往 hail vt.向…欢呼 vi.招呼
pilgrimn.香客，朝圣者 spice n.香料，调味品；香气
fragrant a.香的，芬芳的 analogy n.相似，类似；比拟
incense n.香，熏香；香气 uniformly ad.相同地；一贯
resemblance n.相似，相似性 correlation n.相互关系；对射
interact vi.相互作用 coincide vi.相符合；相巧合
inversely ad.相反地 striking a.显著的，惊人的
qualify vt.限制，限定，修饰 reciprocal a.相互的；互利的
devotion n.献身，热诚，专心 microscopic a.显微镜的，微观的
realistic a.现实的；现实主义的 distinctly ad.显然，清楚地
linear a.线的；长度的 bacon n.咸猪肉，熏猪肉
apparent a.显然的 gossip n.闲谈；碎嘴子；漫笔
ramblevi.闲逛，漫步；聊天 showervi.下阵雨 vt.使湿透
priority n.先，前；优先，重点 declinevt.下倾；偏斜；衰退
precede vt.先于…vi.领先 descent n.下降；出身；斜坡
subordinate a.下级的，辅助的 slim a.细长的；微小的
taper n.细小的蜡烛；微光 petty a.细小的；器量小的
inferior n.下级；晚辈，次品 nice a.细微的，微妙的
filament n.细丝；长丝；灯丝 bacterium n.细菌；拳击迷
systematicallyad.系统地，有规则地 lace vi.系带，用带子束紧
spectrum n.系列，范围；波谱 drama n.戏剧性事件；戏剧性
germ n.细菌，病原菌；幼芽 theatren.戏剧效果
comedy n.喜剧；喜剧场面 quench vt.熄灭，扑灭；压制
tape vt.系，捆 assault vt.袭击；殴打 n.攻击
usage n.习惯法 extinguishvt.熄灭，扑灭；消灭
absorptionn.吸收；专注 intake n.吸入；输入能量
substantial a.物质的；坚固的 physically ad.物质上；体格上
luncheon n.午宴，午餐，便宴 body n.物体；(液)体；实质
ignorance n.无知，无学，愚昧 insignificant a.无意义的；低微的
doubtless ad.无疑地；很可能 iinfinitely ad.无限地，无边地
ndefinite a.无限期的 unlimited a.无限的；不定的
infiniten.无限；无穷(大) incapable a.无能力的；无资格的
fearless a.无畏的，大胆的 uniquea.无可匹敌的；极好的
innumerable a.无数的，数不清的 faultless a.无过失的；无缺点的
inorganic a.无生物的；无机的 foreigna.无关的
ruthless a.无情的，冷酷的 noughtn.无，零
filth n.污秽，污物；淫猥 snail n.蜗牛；行动缓慢的人
compliment n.问候 vt.赞美，祝贺 question vt.问，询问，讯问
hum n.嗡嗡声 vt.哼曲子 literal a.文字(上)的；字面的
illiterate a.文盲的 n.文盲 stationery n.文具；信笺
plague n.瘟疫，鼠疫；天灾 situated a.位于…的
graze vi.喂草；放牧(牲畜) latitude n.纬度；黄纬
softness n.温和，柔和；软弱 commission n.委托，委任；委托状
localityn.位置，地点，发生地 vitamin n.维生素，维他命
stern n.艉，船尾；臀部 idealism n.唯心主义；理想主义
unpaida.未付的；不支薪水的 Venus n.维纳斯；美人；色情
bachelor n.未婚男子；学士 mast n.桅杆；杆 vt.扯帆
violation n.违犯；侵犯，妨碍 towards prep.为了，有助于
enclosure n.围绕；围场，围栏 catalogue vt.为…编目录
violate vt.违犯，违背；侵犯 subtle a.微妙的；精巧的
plead vt.为…辩护 vi.抗辩 microprocessor n.微信息处理机
bitterness n.苦味，辛酸，苦难 wither vi.枯萎 vt.使衰弱
parade vt.夸耀(才能等) fastener n.扣件，钮扣，揿钮
clasp vt.扣住，扣紧，钩住 stammer vt.口吃地说 n.口吃
panic n.恐慌，惊慌 spatial a.空间的，占据空间的
terrorist n.恐怖分子 suspiciousa.可疑的；猜疑的
fantastic a.空想的；奇异的 shady a.可疑的，靠不住的
pneumatica.空气的；气动的 questionable a.可疑的，不可靠的
aerial a.空气的；航空的 gnaw vt.啃，咬断 vi.啮
peacock n.孔雀 portable a.可移动的
void a.空的；无效的 adjustable a.可调整的，可校准的
longing n.渴望 a.显示渴望的 frightful a.可怕的；讨厌的
grateful a.可喜的，令人愉快的 formidablea.可怕的；难对付的
dreadful a.可怕的；令人敬畏的 likelihood n.可能(性)
possibility n.可能的事 particular a.苛求的；特称的
monstrous a.可怕的；极大的 appreciable a.可估价的；可察觉的
respectable a.可敬的；人格高尚的 whereby ad.靠什么；靠那个
shameful a.可耻的；不道德的 pondervt.考虑 vi.沉思
comparable a.可比较的；类似的 exploration n.考察；勘探；探查
discern vt.看出，辨出；辨别 inaugurate vt.开始；使就职
generosity n.慷慨，宽宏大量 initiatevt.开始，创始；启蒙
fell vt.砍倒(树等)；砍伐 commencevt.开始 vi.获得学位
carry vt.刊登 reclaim vt.开垦，开拓；回收
evolution n.开方；(天体的)形成 unlock vt.开…的锁；开启
start vt.开动，着手；开设 sheriff n.郡长；警察局长
sovereign n.君主 a.统治的 reel vt.卷，绕
monarch n.君主，最高统治者 mob vi.聚众闹事
bugle n.军号，喇叭 decisive a.决定性的；果断的
extinct a.绝种的；熄灭了的 polymer n.聚合物，多聚物
govern vt.决定，支配；控制 hurricane n.飓风，十二级风
winding n.卷绕着的线 a.卷曲的 sting n.剧痛；刺激 vt.刺
curly a.卷曲的；有卷毛的 gigantic a.巨大的；巨人似的
repel vt.拒绝；使厌恶 upholdvt.举起；支撑；赞成
exemplify vt.举例证明(解释) rectangle n.矩形，长方形
reside vi.居住，驻扎；属于 administration n.局(或署、处等)
induction n.就职；归纳推理 Christ n.救世主(耶稣基督)
second-hand n.旧的，第二手的 dwell n.居住 vi.凝思，细想
symposium n.酒会；座谈会 whoever pron.究竟是谁
rectify vt.纠正；调整；精馏 vein n.静脉，血管，矿脉
competitorn.竞争者，敌手 competitive a.竞争的，比赛的
contend vi.竞争 vt.坚决主张 alert a.警惕的；活跃的
warning n.警告，告诫，鉴诫 whale n.鲸；庞然大物
selection n.精选的东西；选择 literarya.精通文学的
thorough a.精心的；详尽的 refinery n.精炼厂，提炼厂
finely ad.精细地，美好地 vigorous a.精力旺盛的，茁壮的
fright n.惊吓，恐怖 dismay n.惊慌，沮丧，灰心
astonishment n.惊奇，惊讶 empirical a.经验主义的
support vt.经受，承受，忍受 longitude n.经线，经度
economicsn.经济学；经济 notwithstanding prep.尽管，虽然
prohibition n.禁止；禁令，禁律 perfection n.尽善尽美；无比精确
shortcut n.近路，捷径 prudent a.谨慎的；精明的
inlet n.进口，水湾 vt.引进 compact a.紧密的 vt.使紧凑
tightly ad.紧地，牢固地 barely ad.仅仅，勉强
metallic a.金属的 n.金属粒子 interpret vt.解释 vi.口译
tuna n.金枪鱼 untie vt.解开，松开；解放
henceforthad.今后，从今以后 tackle vt.解决，对付 n.用具
presentation n.介绍；赠送；呈现 dissolve vt.解除(婚约等)
mustard n.芥子，芥末 tuberculosis n.结核病，肺结核
version n.解释 incorporate vt.结合，合并，收编
construction n.结构；作图(法) yeast n.酵母
abbreviation n.节略，缩写，缩短 tutor vt.教，指导
thrifty a.节俭的；兴旺的 disillusion n.觉醒 vt.使觉醒
economically ad.节约地，在经济上 horn n.角状物，角制品
interview vt.接见，会见，会谈 reef n.礁，礁石，暗礁
receiver n.接待者；收受者 coke n.焦炭 vt.&vi.炼焦
doctrine n.教义，主义；学说 intercourse n.交际，往来，交流
symphony n.交响乐；交响乐团 degradation n.降级；退化；衰变
soyn.酱油；大豆，黄豆 parachute n.降落伞；风散种子
oar n.桨；划手 vi.划(行) discourse n.讲话，演说，讲道
ginger n.姜，生姜 inspector n.检查员；巡官
architect n.建筑师；创造者 reserven.缄默，自我克制
`;

const lines = text.split('\n');
const words = [];
for (let line of lines) {
    line = line.trim();
    if (!line) continue;
    // Extract english word and chinese definition pairs.
    // e.g. "initially ad.最初，开始 makeup n.组织；性格；化装品"
    
    // We can split by words that consist only of english letters and optional hyphen, followed by space, followed by part of speech
    // e.g. "initially ad."
    
    const parts = line.split(/\s(?=[a-zA-Z\-]+\s+[a-z&\.]+\.)/g);
    for (const part of parts) {
        const match = part.trim().match(/^([a-zA-Z\-]+)\s+(.+)$/);
        if (match) {
            words.push({
                english: match[1],
                definition: match[2],
                book: 'CET6'
            });
        }
    }
}

const config = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf8"));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function upload() {
    console.log(`Parsed ${words.length} words.`);
    let batch = writeBatch(db);
    let count = 0;
    
    for (const word of words) {
        const newDocRef = doc(collection(db, "words"));
        batch.set(newDocRef, {
            ...word,
            id: newDocRef.id
        });
        count++;
        if (count % 400 === 0) {
            await batch.commit();
            batch = writeBatch(db);
        }
    }
    if (count % 400 !== 0) {
        await batch.commit();
    }
    console.log(`Successfully uploaded ${count} words.`);
    process.exit(0);
}

upload().catch(err => {
    console.error(err);
    process.exit(1);
});

