export type InteractionRewardKind = 'chat' | 'feed' | 'rest'

export interface InteractionReward {
  kind: InteractionRewardKind
  mood: number
  hunger: number
  energy: number
}

const FEED_KEYWORDS = [
  '喂你',
  '吃点',
  '请你吃',
  '小鱼干',
  '点心',
  '汉堡',
  '甜点',
  '零食',
  '罐头'
]

const REST_KEYWORDS = [
  '休息',
  '睡觉',
  '辛苦了',
  '完成任务',
  '下班了',
  '学习完了',
  '加油',
  '鼓励',
  '午睡'
]

const FEED_REWARD: InteractionReward = {
  kind: 'feed',
  mood: 2,
  hunger: 12,
  energy: 0
}

const REST_REWARD: InteractionReward = {
  kind: 'rest',
  mood: 1,
  hunger: 0,
  energy: 8
}

const CHAT_REWARD: InteractionReward = {
  kind: 'chat',
  mood: 2,
  hunger: 0,
  energy: 0
}

const includesAny = (text: string, keywords: string[]) => keywords.some(keyword => text.includes(keyword))

export function detectInteractionReward(input: string): InteractionReward {
  const text = input.trim().toLowerCase()

  if (includesAny(text, FEED_KEYWORDS)) {
    return FEED_REWARD
  }

  if (includesAny(text, REST_KEYWORDS)) {
    return REST_REWARD
  }

  return CHAT_REWARD
}
