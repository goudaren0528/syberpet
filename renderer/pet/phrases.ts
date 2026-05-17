import type { BubbleSource, PetNeeds } from '../store/state'

const CUTE_PHRASES = [
  '贴贴一下主人，今天也要元气满满喵。',
  '我在认真陪你哦，不许把我忘掉。',
  '爪爪已经准备好营业啦。',
  '欸嘿，我刚刚偷偷看了你一眼。',
  '今天也想被夸一句可爱。'
]

const MORNING_PHRASES = [
  '早安呀，新的任务也要一起加油。',
  '晨光签到成功，今天请多陪陪我。'
]

const AFTERNOON_PHRASES = [
  '下午好，要不要让我陪你摸会儿鱼。',
  '太阳暖暖的，适合一起慢慢做事。'
]

const EVENING_PHRASES = [
  '晚上啦，别忘了让眼睛休息一下。',
  '夜色就位，我也进入陪伴模式了。'
]

const HUNGER_PHRASES = [
  '肚子有点空空的，想吃小鱼干。',
  '我好像饿啦，喂我一点能量嘛。',
  '库存告急，猫猫申请加餐。'
]

const ENERGY_PHRASES = [
  '有点困呼呼，我想缩成一团休息。',
  '电量偏低，想眯一小会儿。',
  '如果能睡一觉，我会更精神喵。'
]

const HAPPY_PHRASES = [
  '今天心情很好，因为主人在这里。',
  '被陪伴的感觉真好，我超开心。',
  '你认真做事的时候也很闪亮呀。'
]

const LOW_MOOD_PHRASES = [
  '我有一点点委屈，想被摸摸头。',
  '今天想安静地靠近你一会儿。'
]

const pick = (items: string[]) => items[Math.floor(Math.random() * items.length)]

export function pickPetBubble(needs: PetNeeds, now = new Date()): { text: string; source: BubbleSource } {
  if (needs.hunger < 30) {
    return { text: pick(HUNGER_PHRASES), source: 'need' }
  }

  if (needs.energy < 25) {
    return { text: pick(ENERGY_PHRASES), source: 'need' }
  }

  if (needs.mood < 35 && Math.random() < 0.45) {
    return { text: pick(LOW_MOOD_PHRASES), source: 'need' }
  }

  if (needs.mood > 75 && Math.random() < 0.4) {
    return { text: pick(HAPPY_PHRASES), source: 'preset' }
  }

  const hour = now.getHours()
  if (hour < 11 && Math.random() < 0.25) {
    return { text: pick(MORNING_PHRASES), source: 'preset' }
  }
  if (hour >= 11 && hour < 18 && Math.random() < 0.25) {
    return { text: pick(AFTERNOON_PHRASES), source: 'preset' }
  }
  if (hour >= 18 && Math.random() < 0.3) {
    return { text: pick(EVENING_PHRASES), source: 'preset' }
  }

  return { text: pick(CUTE_PHRASES), source: 'preset' }
}
