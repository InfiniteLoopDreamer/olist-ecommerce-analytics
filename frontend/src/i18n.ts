/** 前端展示用中文映射 */

export const PAYMENT_ZH: Record<string, string> = {
  credit_card: "信用卡",
  boleto: "银行票据",
  voucher: "代金券",
  debit_card: "借记卡",
  not_defined: "未定义",
};

export const STATUS_ZH: Record<string, string> = {
  delivered: "已送达",
  shipped: "运输中",
  canceled: "已取消",
  unavailable: "不可用",
  invoiced: "已开票",
  processing: "处理中",
  created: "已创建",
  approved: "已审批",
};

export const SEGMENT_ZH: Record<string, string> = {
  Champions: "冠军客户",
  Loyal: "忠诚客户",
  Promising: "高潜客户",
  "New / Recent": "新近客户",
  "At Risk": "流失风险",
  "Hibernating High-Value": "沉睡高价值",
  "Lost / One-time": "流失/一次性",
  "Need Attention": "需关注",
};

export const STATE_ZH: Record<string, string> = {
  SP: "圣保罗",
  RJ: "里约热内卢",
  MG: "米纳斯吉拉斯",
  RS: "南里奥格兰德",
  PR: "巴拉那",
  SC: "圣卡塔琳娜",
  BA: "巴伊亚",
  DF: "联邦区",
  GO: "戈亚斯",
  ES: "圣埃斯皮里图",
  PE: "伯南布哥",
  CE: "塞阿拉",
  PA: "帕拉",
  MT: "马托格罗索",
  MA: "马拉尼昂",
  MS: "南马托格罗索",
  PB: "帕拉伊巴",
  RN: "北里奥格兰德",
  PI: "皮奥伊",
  AL: "阿拉戈斯",
  SE: "塞尔希培",
  TO: "托坎廷斯",
  RO: "朗多尼亚",
  AM: "亚马孙",
  AC: "阿克里",
  AP: "阿马帕",
  RR: "罗赖马",
};

/** Olist 英文品类 → 中文 */
export const CATEGORY_ZH: Record<string, string> = {
  health_beauty: "健康美容",
  watches_gifts: "手表礼品",
  bed_bath_table: "床上浴室用品",
  sports_leisure: "运动休闲",
  furniture_decor: "家具装饰",
  computers_accessories: "电脑配件",
  housewares: "家居用品",
  cool_stuff: "趣味好物",
  auto: "汽车用品",
  garden_tools: "园艺工具",
  toys: "玩具",
  baby: "母婴",
  perfumery: "香水",
  telephony: "通讯设备",
  stationery: "文具",
  fashion_bags_accessories: "时尚箱包",
  pet_shop: "宠物用品",
  electronics: "电子产品",
  office_furniture: "办公家具",
  consoles_games: "游戏主机",
  luggage_accessories: "旅行箱包",
  construction_tools_construction: "建筑工具",
  home_appliances: "家用电器",
  home_construction: "家装建材",
  musical_instruments: "乐器",
  small_appliances: "小家电",
  books_general_interest: "图书",
  fashion_shoes: "时尚鞋履",
  furniture_living_room: "客厅家具",
  home_confort: "家居舒适",
  audio: "音频设备",
  food_drink: "食品饮料",
  market_place: "集市商品",
  air_conditioning: "空调",
  drinks: "饮料",
  food: "食品",
  kitchen_dining_laundry_garden_furniture: "厨卫园家具",
  fashion_male_clothing: "男装",
  tablets_printing_image: "平板打印影像",
  home_appliances_2: "家电 II",
  fixed_telephony: "固定电话",
  signaling_and_security: "安防信号",
  furniture_bedroom: "卧室家具",
  fashion_underwear_beach: "内衣泳装",
  construction_tools_lights: "照明工具",
  computers: "电脑",
  art: "艺术品",
  industry_commerce_and_business: "工商业",
  agro_industry_and_commerce: "农工商业",
  christmas_supplies: "圣诞用品",
  fashion_sport: "运动时尚",
  books_technical: "技术图书",
  home_comfort_2: "家居舒适 II",
  small_appliances_home_oven_and_coffee: "烤箱咖啡机",
  cds_dvds_musicals: "影音光盘",
  movies_and_tv: "影视",
  dvds_blu_ray: "蓝光影碟",
  books_imported: "进口图书",
  furniture_mattress_and_upholstery: "床垫软装",
  party_supplies: "派对用品",
  diapers_and_hygiene: "纸尿裤卫生",
  fashion_childrens_clothes: "童装",
  music: "音乐",
  arts_and_craftmanship: "手工艺",
  flowers: "鲜花",
  fashion_female_clothing: "女装",
  la_cuisine: "厨具",
  security_and_services: "安保服务",
  unknown: "未知品类",
};

export function zhPayment(v: string) {
  return PAYMENT_ZH[v] ?? v;
}
export function zhStatus(v: string) {
  return STATUS_ZH[v] ?? v;
}
export function zhSegment(v: string) {
  return SEGMENT_ZH[v] ?? v;
}
export function zhState(v: string) {
  return STATE_ZH[v] ?? v;
}
export function zhCategory(v: string) {
  return CATEGORY_ZH[v] ?? v.replaceAll("_", " ");
}
