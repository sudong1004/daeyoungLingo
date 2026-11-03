/**
 * 상황별 회화 데이터. 한 대화는 번갈아 오가는 줄들로 이루어져 있고,
 * who: "me" 는 내가 말할 대사(연습에서 문장 만들기로 풀어요), "other" 는 상대방 대사입니다.
 * 문장 부호는 자유롭게 써도 되고, 연습할 때는 끝의 . , ! ? 가 빠진 단어 카드로 나옵니다.
 */
export interface DialogueLine {
  who: "me" | "other";
  en: string;
  ko: string;
}

export interface Scenario {
  id: string;
  title: string;
  emoji: string;
  intro: string; // 상황 설명 (한국어)
  level: 1 | 2 | 3; // 1 = 가장 쉬움
  lines: DialogueLine[];
}

export const SCENARIOS: Scenario[] = [
  {
    id: "intro",
    title: "처음 만났을 때",
    emoji: "👋",
    intro: "새로운 사람을 만나 인사하고 자기소개를 해요.",
    level: 1,
    lines: [
      { who: "other", en: "Hi, I'm Anna. Nice to meet you.", ko: "안녕하세요, 저는 애나예요. 만나서 반가워요." },
      { who: "me", en: "Nice to meet you, too. I'm Minho.", ko: "저도 만나서 반가워요. 저는 민호예요." },
      { who: "other", en: "Where are you from?", ko: "어디에서 오셨어요?" },
      { who: "me", en: "I'm from Korea.", ko: "저는 한국에서 왔어요." },
      { who: "other", en: "What do you do?", ko: "무슨 일 하세요?" },
      { who: "me", en: "I work at a small company.", ko: "저는 작은 회사에서 일해요." },
      { who: "other", en: "That sounds nice. See you later!", ko: "좋은 것 같네요. 나중에 봐요!" },
      { who: "me", en: "See you later. Take care.", ko: "나중에 봐요. 몸조심하세요." },
    ],
  },
  {
    id: "cafe",
    title: "카페에서 주문하기",
    emoji: "☕",
    intro: "카페에서 음료를 주문하고 계산해요.",
    level: 1,
    lines: [
      { who: "other", en: "Hi, what can I get for you?", ko: "안녕하세요, 뭘 드릴까요?" },
      { who: "me", en: "I'd like a coffee, please.", ko: "커피 한 잔 주세요." },
      { who: "other", en: "Hot or iced?", ko: "따뜻한 걸로요, 아이스로요?" },
      { who: "me", en: "Iced, please.", ko: "아이스로 주세요." },
      { who: "other", en: "Anything else?", ko: "다른 건 필요 없으세요?" },
      { who: "me", en: "No, that's all. How much is it?", ko: "아니요, 그게 다예요. 얼마예요?" },
      { who: "other", en: "It's four dollars.", ko: "4달러예요." },
      { who: "me", en: "Here you are. Thank you.", ko: "여기 있어요. 감사합니다." },
    ],
  },
  {
    id: "directions",
    title: "길 물어보기",
    emoji: "🗺️",
    intro: "길을 잃었을 때 지나가는 사람에게 길을 물어요.",
    level: 2,
    lines: [
      { who: "me", en: "Excuse me, where is the subway station?", ko: "실례합니다, 지하철역이 어디예요?" },
      { who: "other", en: "Go straight for two blocks.", ko: "두 블록 쭉 가세요." },
      { who: "me", en: "Is it far from here?", ko: "여기서 멀어요?" },
      { who: "other", en: "No, it's near. Turn left at the corner.", ko: "아니요, 가까워요. 모퉁이에서 왼쪽으로 도세요." },
      { who: "me", en: "Turn left at the corner. Got it.", ko: "모퉁이에서 왼쪽이요. 알겠어요." },
      { who: "other", en: "You will see the station on your right.", ko: "오른쪽에 역이 보일 거예요." },
      { who: "me", en: "Thank you so much for your help.", ko: "도와주셔서 정말 감사합니다." },
    ],
  },
  {
    id: "restaurant",
    title: "식당에서",
    emoji: "🍽️",
    intro: "식당에서 자리를 안내받고 음식을 주문해요.",
    level: 2,
    lines: [
      { who: "other", en: "Welcome. Do you have a reservation?", ko: "어서 오세요. 예약하셨어요?" },
      { who: "me", en: "Yes, I have a reservation for two.", ko: "네, 두 명 예약했어요." },
      { who: "other", en: "Right this way, please. Here is the menu.", ko: "이쪽으로 오세요. 메뉴 여기 있어요." },
      { who: "me", en: "I'm allergic to nuts. Is this dish okay?", ko: "저는 견과류 알레르기가 있어요. 이 요리 괜찮아요?" },
      { who: "other", en: "Yes, it has no nuts.", ko: "네, 견과류는 안 들어가요." },
      { who: "me", en: "Great. I'll have the soup and a salad.", ko: "좋아요. 수프랑 샐러드로 할게요." },
      { who: "other", en: "Would you like something to drink?", ko: "마실 것도 드릴까요?" },
      { who: "me", en: "Just water, please.", ko: "물만 주세요." },
    ],
  },
  {
    id: "airport",
    title: "공항 체크인",
    emoji: "✈️",
    intro: "공항 카운터에서 체크인하고 짐을 부쳐요.",
    level: 3,
    lines: [
      { who: "other", en: "Good morning. May I see your passport?", ko: "좋은 아침이에요. 여권 좀 보여 주시겠어요?" },
      { who: "me", en: "Here is my passport.", ko: "여기 제 여권이에요." },
      { who: "other", en: "Do you have any luggage to check in?", ko: "부칠 짐이 있으세요?" },
      { who: "me", en: "Yes, I have one bag.", ko: "네, 가방 하나 있어요." },
      { who: "other", en: "Would you like a window seat or an aisle seat?", ko: "창가 좌석과 복도 좌석 중 어떤 게 좋으세요?" },
      { who: "me", en: "A window seat, please.", ko: "창가 좌석으로 주세요." },
      { who: "other", en: "Your flight leaves at ten. Please arrive early.", ko: "비행기는 10시에 떠나요. 일찍 도착해 주세요." },
      { who: "me", en: "Thank you. Have a nice day.", ko: "감사합니다. 좋은 하루 보내세요." },
    ],
  },
  {
    id: "shopping",
    title: "옷 가게에서",
    emoji: "🛍️",
    intro: "옷을 입어 보고 사이즈를 바꿔요.",
    level: 2,
    lines: [
      { who: "other", en: "Hi, are you looking for something?", ko: "안녕하세요, 찾으시는 게 있으세요?" },
      { who: "me", en: "Yes, I'm looking for a jacket.", ko: "네, 재킷을 찾고 있어요." },
      { who: "other", en: "This one is new. Would you like to try it on?", ko: "이게 신상이에요. 입어 보시겠어요?" },
      { who: "me", en: "Yes, please. Do you have a bigger size?", ko: "네, 좋아요. 더 큰 사이즈 있어요?" },
      { who: "other", en: "Sure. Here you go.", ko: "물론이죠. 여기 있어요." },
      { who: "me", en: "It fits well. Is there a discount?", ko: "잘 맞아요. 할인이 있나요?" },
      { who: "other", en: "Yes, it is ten percent off today.", ko: "네, 오늘 10퍼센트 할인이에요." },
    ],
  },
  {
    id: "hospital",
    title: "몸이 안 좋을 때",
    emoji: "🏥",
    intro: "아픈 곳을 설명하고 약을 받아요.",
    level: 3,
    lines: [
      { who: "other", en: "What seems to be the problem?", ko: "어디가 불편하세요?" },
      { who: "me", en: "I have a headache and a fever.", ko: "머리가 아프고 열이 나요." },
      { who: "other", en: "How long have you felt sick?", ko: "얼마나 아프셨어요?" },
      { who: "me", en: "Since yesterday morning.", ko: "어제 아침부터요." },
      { who: "other", en: "Take this medicine twice a day.", ko: "이 약을 하루에 두 번 드세요." },
      { who: "me", en: "Should I rest at home?", ko: "집에서 쉬어야 할까요?" },
      { who: "other", en: "Yes, drink water and get some rest.", ko: "네, 물을 마시고 푹 쉬세요." },
    ],
  },
  {
    id: "plans",
    title: "약속 잡기",
    emoji: "📅",
    intro: "친구와 주말 약속을 잡아요.",
    level: 3,
    lines: [
      { who: "other", en: "Are you free this weekend?", ko: "이번 주말에 시간 있어?" },
      { who: "me", en: "I think so. What's the plan?", ko: "있을 것 같아. 무슨 계획이야?" },
      { who: "other", en: "Let's watch a movie on Saturday.", ko: "토요일에 영화 보자." },
      { who: "me", en: "That sounds great. What time?", ko: "좋아. 몇 시에?" },
      { who: "other", en: "How about three in the afternoon?", ko: "오후 세 시 어때?" },
      { who: "me", en: "Perfect. Let's meet at the station.", ko: "완벽해. 역에서 만나자." },
      { who: "other", en: "Okay. See you on Saturday!", ko: "좋아. 토요일에 봐!" },
    ],
  },
  {
    id: "hotel",
    title: "호텔 체크인",
    emoji: "🏨",
    intro: "호텔에 도착해서 체크인하고 필요한 걸 부탁해요.",
    level: 2,
    lines: [
      { who: "other", en: "Welcome to the hotel. How can I help you?", ko: "호텔에 오신 걸 환영합니다. 무엇을 도와드릴까요?" },
      { who: "me", en: "I'd like to check in, please.", ko: "체크인하고 싶어요." },
      { who: "other", en: "Do you have a reservation?", ko: "예약하셨어요?" },
      { who: "me", en: "Yes, my name is Minho Kim.", ko: "네, 제 이름은 김민호예요." },
      { who: "other", en: "Here is your key. Your room is on the fifth floor.", ko: "여기 열쇠예요. 방은 5층이에요." },
      { who: "me", en: "Is breakfast included?", ko: "아침 식사가 포함되어 있나요?" },
      { who: "other", en: "Yes, it is from seven to ten.", ko: "네, 7시부터 10시까지예요." },
      { who: "me", en: "Could I have an extra towel, please?", ko: "수건 하나 더 받을 수 있을까요?" },
    ],
  },
  {
    id: "taxi",
    title: "택시 타기",
    emoji: "🚕",
    intro: "택시를 타고 목적지를 말하고 요금을 내요.",
    level: 2,
    lines: [
      { who: "other", en: "Hello. Where to?", ko: "안녕하세요. 어디로 갈까요?" },
      { who: "me", en: "To the airport, please.", ko: "공항으로 가 주세요." },
      { who: "other", en: "Sure. Traffic is bad today.", ko: "네. 오늘 길이 막혀요." },
      { who: "me", en: "How long will it take?", ko: "얼마나 걸릴까요?" },
      { who: "other", en: "About forty minutes.", ko: "40분쯤 걸려요." },
      { who: "me", en: "Okay. I'm in a hurry.", ko: "알겠어요. 제가 좀 급해요." },
      { who: "other", en: "We are here. That's twenty dollars.", ko: "도착했어요. 20달러예요." },
      { who: "me", en: "Here you are. Keep the change.", ko: "여기 있어요. 거스름돈은 가지세요." },
    ],
  },
  {
    id: "market",
    title: "마트에서 계산하기",
    emoji: "🛒",
    intro: "마트에서 물건을 찾고 계산대에서 결제해요.",
    level: 1,
    lines: [
      { who: "me", en: "Excuse me, where is the milk?", ko: "실례합니다, 우유가 어디 있어요?" },
      { who: "other", en: "It's in aisle three, next to the eggs.", ko: "3번 통로에 있어요, 달걀 옆이에요." },
      { who: "me", en: "Thank you very much.", ko: "정말 고맙습니다." },
      { who: "other", en: "Did you find everything you need?", ko: "필요한 건 다 찾으셨어요?" },
      { who: "me", en: "Yes, I did. How much is it?", ko: "네, 다 찾았어요. 얼마예요?" },
      { who: "other", en: "That will be twelve dollars.", ko: "12달러예요." },
      { who: "me", en: "Can I pay by card?", ko: "카드로 계산해도 돼요?" },
      { who: "other", en: "Of course. Do you need a bag?", ko: "물론이죠. 봉투 필요하세요?" },
    ],
  },
  {
    id: "phone",
    title: "전화로 예약하기",
    emoji: "📞",
    intro: "식당에 전화를 걸어서 자리를 예약해요.",
    level: 3,
    lines: [
      { who: "other", en: "Good evening. This is Green Table.", ko: "안녕하세요. 그린 테이블입니다." },
      { who: "me", en: "Hello, I'd like to make a reservation.", ko: "안녕하세요, 예약을 하고 싶어요." },
      { who: "other", en: "Sure. How many people?", ko: "네. 몇 분이세요?" },
      { who: "me", en: "Four people, at seven o'clock.", ko: "네 명이고, 7시예요." },
      { who: "other", en: "What day would you like?", ko: "무슨 요일로 하시겠어요?" },
      { who: "me", en: "This Friday, please.", ko: "이번 주 금요일로 부탁해요." },
      { who: "other", en: "All set. Can I have your name?", ko: "예약됐어요. 성함이 어떻게 되세요?" },
      { who: "me", en: "My name is Minho. Thank you.", ko: "제 이름은 민호예요. 감사합니다." },
    ],
  },
  {
    id: "lost",
    title: "물건을 잃어버렸을 때",
    emoji: "🎒",
    intro: "가방을 잃어버려서 직원에게 도움을 청해요.",
    level: 3,
    lines: [
      { who: "me", en: "Excuse me, I lost my bag.", ko: "실례합니다, 가방을 잃어버렸어요." },
      { who: "other", en: "I'm sorry to hear that. What does it look like?", ko: "안타깝네요. 어떻게 생겼나요?" },
      { who: "me", en: "It's a small black bag.", ko: "작은 검은색 가방이에요." },
      { who: "other", en: "Where did you last see it?", ko: "마지막으로 어디서 보셨어요?" },
      { who: "me", en: "I think I left it on the bus.", ko: "버스에 두고 내린 것 같아요." },
      { who: "other", en: "Please write your phone number here.", ko: "여기에 전화번호를 적어 주세요." },
      { who: "me", en: "Please call me if you find it.", ko: "찾으면 전화 주세요." },
    ],
  },
  {
    id: "repeat",
    title: "못 알아들었을 때",
    emoji: "🙋",
    intro: "상대의 말이 빠르거나 어려울 때 다시 말해 달라고 해요.",
    level: 1,
    lines: [
      { who: "other", en: "The meeting starts at half past nine.", ko: "회의는 아홉 시 반에 시작해요." },
      { who: "me", en: "Sorry, could you say that again?", ko: "죄송한데, 다시 말해 주시겠어요?" },
      { who: "other", en: "The meeting starts at half past nine.", ko: "회의는 아홉 시 반에 시작해요." },
      { who: "me", en: "Could you speak more slowly, please?", ko: "좀 더 천천히 말해 주시겠어요?" },
      { who: "other", en: "Sure. Nine thirty. In the big room.", ko: "그럼요. 아홉 시 삼십 분. 큰 방에서요." },
      { who: "me", en: "I see. What does half past mean?", ko: "알겠어요. half past가 무슨 뜻이에요?" },
      { who: "other", en: "It means thirty minutes after nine.", ko: "9시에서 30분 지났다는 뜻이에요." },
      { who: "me", en: "Oh, I understand now. Thank you.", ko: "아, 이제 이해했어요. 고마워요." },
    ],
  },
  {
    id: "smalltalk",
    title: "취미와 날씨 이야기",
    emoji: "🌤️",
    intro: "가볍게 안부를 묻고 취미에 대해 이야기해요.",
    level: 2,
    lines: [
      { who: "other", en: "Hey, how's it going?", ko: "안녕, 잘 지내?" },
      { who: "me", en: "Pretty good. The weather is nice today.", ko: "꽤 좋아. 오늘 날씨가 좋네." },
      { who: "other", en: "Yes, it's sunny. What do you do on weekends?", ko: "응, 화창하지. 주말에는 뭐 해?" },
      { who: "me", en: "I usually watch movies at home.", ko: "보통 집에서 영화를 봐." },
      { who: "other", en: "Do you like to exercise?", ko: "운동 좋아해?" },
      { who: "me", en: "Yes, I walk in the park every morning.", ko: "응, 매일 아침 공원에서 걸어." },
      { who: "other", en: "That's great. Let's walk together sometime.", ko: "좋네. 언제 같이 걷자." },
      { who: "me", en: "Sounds good. See you soon!", ko: "좋아. 곧 보자!" },
    ],
  },
  {
    id: "complaint",
    title: "음식이 잘못 나왔을 때",
    emoji: "🍜",
    intro: "주문과 다른 음식이 나왔을 때 정중하게 말해요.",
    level: 3,
    lines: [
      { who: "other", en: "Here is your soup. Enjoy your meal.", ko: "수프 나왔습니다. 맛있게 드세요." },
      { who: "me", en: "Excuse me, I didn't order this.", ko: "실례합니다, 저는 이걸 주문하지 않았어요." },
      { who: "other", en: "Oh, I'm sorry. What did you order?", ko: "아, 죄송합니다. 무엇을 주문하셨죠?" },
      { who: "me", en: "I ordered the noodles, not the soup.", ko: "수프가 아니라 국수를 주문했어요." },
      { who: "other", en: "I'll bring them right away.", ko: "바로 가져다 드릴게요." },
      { who: "me", en: "Thank you. Also, could I have some water?", ko: "감사합니다. 그리고 물도 좀 주시겠어요?" },
      { who: "other", en: "Of course. Sorry for the wait.", ko: "물론이죠. 기다리게 해서 죄송합니다." },
    ],
  },
];

export function getScenario(id: string): Scenario | undefined {
  return SCENARIOS.find((s) => s.id === id);
}

/** 내가 말할 대사 개수 */
export function myLineCount(s: Scenario): number {
  return s.lines.filter((l) => l.who === "me").length;
}
