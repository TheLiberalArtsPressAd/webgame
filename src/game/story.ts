import type { GameState } from './state';
import type { BgmName } from '../engine/audio';

export interface StoryLine {
  who: string;
  text: string;
  /** 說話者立繪用的種族 id（幻獸） */
  beast?: string;
}

export interface StoryNode {
  lines: StoryLine[];
  /** 以 ';' 分隔的多個動作，於對話結束後執行 */
  action?: string;
  choices?: { text: string; action?: string }[];
}

// ─────────────────────────────────────────────────────────────
// 任務提示
// ─────────────────────────────────────────────────────────────
export function questHint(s: GameState): string {
  if (s.flags['star_ended']) return '星海之願，已經實現。';
  if (s.flags['true_ended']) {
    switch (s.stage) {
      case 14:
        return '風空港東邊的海上，據說浮起了一座星海渡口。';
      case 15:
        return '往星海渡口南方，走進星霧林。';
      case 16:
        return '穿越彗星迴橋，前往碎星鍛坊。';
      case 17:
        return '登上星之搖籃，面對星海之主。';
      default:
        return '冒險已告一段落。';
    }
  }
  if (s.flags['ended']) {
    switch (s.stage) {
      case 11:
        return '風空港出現了通往「深淵迴廊」的裂縫。';
      case 12:
        return '深入深淵迴廊，尋找中樞的存在。';
      case 13:
        return '走向迴廊最深處，面對一切的源頭。';
      default:
        return '冒險已告一段落。';
    }
  }
  switch (s.stage) {
    case 0:
      return '與村中的「星見長老」談話。';
    case 1:
      return '前往村南的微風草原，調查暴走幻獸。';
    case 2:
      return s.flags['rin_joined']
        ? '回到晨曦村，向星見長老報告。'
        : '與草原上的遊俠少女交談。';
    case 3:
      return '前往北方星塵洞窟的深處。';
    case 4:
      return '穿越暮色古道，前往暮色港。';
    case 5:
      return '在暮色港面對蝕影教團。';
    case 6:
      return '與暮色港的船長 老莫談話，搭船前往霜之國。';
    case 7:
      return '在霜華港向長老 伊莎打聽教團的消息。';
    case 8:
      return '前往霜牙雪原北方的冰晶洞窟。';
    case 9:
      return '前往東方的流金沙原，追查教團的蹤跡。';
    case 10:
      return '前往流金沙原北方的風空港，登上星穹神殿。';
    case 11:
      return '星塵大陸的光，已經回到天上。';
    default:
      return '自由探索星塵大陸。';
  }
}

// ─────────────────────────────────────────────────────────────
// 各 NPC 對話
// ─────────────────────────────────────────────────────────────
export function npcDialogue(id: string, s: GameState): StoryNode {
  switch (id) {
    // ── 晨曦村 ──
    case 'elder': {
      if (s.stage === 0) {
        return {
          lines: [
            { who: '星見長老', text: '旭，你總算來了。' },
            {
              who: '星見長老',
              text: '這幾天，草原上的幻獸很不對勁。牠們不再怕人，也不再認得同伴。'
            },
            {
              who: '星見長老',
              text: '牠們的眼神像被什麼東西吸走了……像是「影子」鑽進了牠們心裡。'
            },
            { who: '旭', text: '是晶石出了問題嗎？' },
            {
              who: '星見長老',
              text: '嗯。守護這片大陸的星塵晶石，光正在一點一點變暗。'
            },
            { who: '星見長老', text: '拿去，這是三顆封印石。' },
            {
              who: '星見長老',
              text: '幻獸本身沒有錯。先削弱牠，再用封印石封住牠，別奪牠們的性命。'
            },
            { who: '旭', text: '我明白了。我去草原看看。' }
          ],
          action: 'give:sealstone:3;flag:quest_started;stage:1'
        };
      }
      if (s.stage === 1) {
        return {
          lines: [
            { who: '星見長老', text: '微風草原就在村子南邊，走過那道石階就是。' },
            { who: '星見長老', text: '別逞強。情況不對就退回來。' }
          ]
        };
      }
      if (s.stage === 2) {
        return {
          lines: [
            { who: '旭', text: '長老，我遇到一個操縱風的少女，她說晶石碎片被人奪走了。' },
            {
              who: '星見長老',
              text: '被人奪走……？那可不是幻獸能做的事。'
            },
            { who: '星見長老', text: '……是「蝕影教團」。' },
            {
              who: '星見長老',
              text: '一群相信「只要幻獸全部暴走，世界就會被洗乾淨」的瘋子。'
            },
            {
              who: '星見長老',
              text: '星塵洞窟裡有最大的晶石礦脈。去那裡，別讓他們得手。'
            },
            { who: '星見長老', text: '路上小心，旭。' }
          ],
          action: 'flag:quest_cave;stage:3'
        };
      }
      if (s.stage === 3) {
        return {
          lines: [
            { who: '星見長老', text: '洞窟的入口在草原的北方，靠近那片岩壁。' },
            { who: '星見長老', text: '裡頭很暗，記得讓幻獸留點魔力。' }
          ]
        };
      }
      if (s.stage === 4) {
        return {
          lines: [
            { who: '星見長老', text: '洞窟深處的守衛也被汙染了嗎……' },
            { who: '星見長老', text: '他們下一步一定是暮色港。那裡是晶石出貨的集散地。' }
          ]
        };
      }
      return {
        lines: [
          { who: '星見長老', text: '去吧，旭。這片大陸的光，就拜託你了。' }
        ],
        action: 'heal'
      };
    }

    case 'shop':
      return {
        lines: [
          { who: '商人 莉亞', text: '歡迎！要補點草藥還是封印石？' },
          { who: '商人 莉亞', text: '打仗這種事，補給比勇氣重要。' }
        ],
        choices: [
          { text: '看看商品', action: 'shop' },
          { text: '把我恢復一下', action: 'heal' },
          { text: '先不用' }
        ]
      };

    case 'kid': {
      if (s.stage === 0) {
        return {
          lines: [{ who: '小虎', text: '哥哥你要去草原嗎？那裡最近有壞掉的幻獸喔！' }]
        };
      }
      if (s.stage >= 3) {
        return {
          lines: [
            { who: '小虎', text: '我長大也要當幻獸使！' },
            { who: '小虎', text: '哥哥你身上那隻兔子，是怎麼抓到的？' }
          ]
        };
      }
      return {
        lines: [{ who: '小虎', text: '長老說，晶石的光變暗的時候，就要有人站出來。' }]
      };
    }

    case 'guard':
      return {
        lines: [
          { who: '衛兵 卡爾', text: '往南就是微風草原。' },
          { who: '衛兵 卡爾', text: '想練功的話，草原外圍的幻獸還算溫和。' },
          { who: '衛兵 卡爾', text: '累了就回村莊，長老會幫你治療。' }
        ]
      };

    // ── 微風草原 ──
    case 'rin_meet': {
      if (!s.flags['ch1_battle']) {
        return {
          lines: [
            { who: '遊俠少女', text: '……別過來。' },
            { who: '遊俠少女', text: '這裡的幻獸全都瘋了。我親眼看到牠們互相攻擊。' },
            { who: '遊俠少女', text: '先解決眼前的事再說。' }
          ]
        };
      }
      if (!s.flags['rin_joined']) {
        return {
          lines: [
            { who: '遊俠少女', text: '你剛才那場打得還不錯嘛。' },
            { who: '鈴', text: '我叫鈴。本來是來草原找人的，結果整片草原都變成這樣。' },
            { who: '鈴', text: '有人奪走了草原上的晶石碎片——那不是幻獸能做的事。' },
            { who: '旭', text: '……是蝕影教團。' },
            { who: '鈴', text: '你知道？那就好辦了。' },
            { who: '鈴', text: '我跟你走。反正一個人打不贏那些傢伙。' }
          ],
          action: 'recruit:hero_rin;flag:rin_joined;stage:2'
        };
      }
      return {
        lines: [
          { who: '鈴', text: '別拖拖拉拉的，我們還得去洞窟呢。' },
          { who: '鈴', text: '（她的風刃真的很利，記得讓她上場。）' }
        ]
      };
    }

    case 'merchant_field':
      return {
        lines: [
          { who: '流浪商人', text: '草原上做生意，圖的就是沒人搶。' },
          { who: '流浪商人', text: '要買要賣，一句話。' }
        ],
        choices: [
          { text: '看看商品', action: 'shop' },
          { text: '先不用' }
        ]
      };

    // ── 星塵洞窟 ──
    case 'cave_explorer':
      return {
        lines: [
          { who: '探險家 布格', text: '噓——別那麼大聲。' },
          { who: '探險家 布格', text: '這裡的晶石礦脈，比十年前我來的時候暗了一半。' },
          { who: '探險家 布格', text: '而且深處那個「守衛」……它本來是不會動的。' },
          { who: '探險家 布格', text: '你如果要去，拜託，先存個檔。' },
          { who: '探險家 布格', text: '（他看起來是真的怕。）' }
        ]
      };

    // ── 暮色古道 ──
    case 'road_scholar':
      return {
        lines: [
          { who: '旅人 米娜', text: '你也是往港口去的嗎？' },
          { who: '旅人 米娜', text: '這一路上，穿黑斗篷的人多了起來。' },
          { who: '旅人 米娜', text: '他們不說話，只是盯著路邊的幻獸看……' },
          { who: '旅人 米娜', text: '我勸你，別跟他們對上眼。' }
        ]
      };

    case 'road_guard':
      return {
        lines: [
          { who: '護路隊 漢斯', text: '這條古道最近很不平靜。' },
          { who: '護路隊 漢斯', text: '再往南就是暮色港了。' },
          { who: '護路隊 漢斯', text: '港口那邊有船醫，累了可以去找她。' }
        ]
      };

    // ── 暮色港 ──
    case 'harbor_luna':
      return {
        lines: [
          { who: '船醫 露娜', text: '哎呀，看你這一路辛苦了。' },
          { who: '船醫 露娜', text: '來，坐下來，我幫你和幻獸看看傷。' }
        ],
        action: 'heal'
      };

    case 'harbor_shop':
      return {
        lines: [
          { who: '道具商 阿財', text: '港口就是物價貴一點，沒辦法。' },
          { who: '道具商 阿財', text: '不過該有的我都有。' }
        ],
        choices: [
          { text: '看看商品', action: 'shop' },
          { text: '先不用' }
        ]
      };

    case 'harbor_captain': {
      if (s.flags['ch1_done']) {
        return {
          lines: [
            { who: '船長 老莫', text: '海面靜下來了。托你的福，總算能開船。' },
            { who: '船長 老莫', text: '往北是霜之國——霜華港。那裡的晶石礦脈也在出事。' },
            { who: '船長 老莫', text: '要不要搭一程？' }
          ],
          choices: [
            { text: '搭船前往霜華港', action: 'travel:frostport:10:1;flag:to_frost;stage:7' },
            { text: '先留在這裡' }
          ]
        };
      }
      return {
        lines: [
          { who: '船長 老莫', text: '船？這幾天沒船出港。' },
          { who: '船長 老莫', text: '海面上的幻獸全都浮上來了，像在等什麼。' },
          { who: '船長 老莫', text: '還有那個穿黑斗篷的祭司，站在碼頭一整天了。' },
          { who: '船長 老莫', text: '年輕人，你要過去？……保重。' }
        ]
      };
    }

    // ── 霜華港 ──
    case 'frost_elder': {
      if (s.stage < 7) {
        return {
          lines: [
            { who: '霜華長老 伊莎', text: '歡迎來到霜之國。你看起來是從南邊的海路來的。' },
            { who: '霜華長老 伊莎', text: '北邊的雪原上，晶石的光比去年又暗了一層。' }
          ]
        };
      }
      if (!s.flags['ch2_start']) {
        return {
          lines: [
            { who: '霜華長老 伊莎', text: '你就是把暮色港的祭司打退的那個人？' },
            { who: '霜華長老 伊莎', text: '那你來得正好。北邊的冰晶洞窟，守衛已經醒過來了。' },
            { who: '霜華長老 伊莎', text: '牠把整條礦脈的霜都吸了進去，誰都不准靠近。' },
            { who: '旭', text: '又是教團動的手嗎？' },
            { who: '霜華長老 伊莎', text: '……恐怕是。他們要的不是晶石，是晶石裡的「光」。' },
            { who: '霜華長老 伊莎', text: '去吧。雪原上的風很強，多帶點藥。' }
          ],
          action: 'flag:ch2_start;stage:8;heal'
        };
      }
      return {
        lines: [{ who: '霜華長老 伊莎', text: '星穹神殿在最北邊的天空上。只有風空港的船能把你送上去。' }],
        action: 'heal'
      };
    }

    case 'frost_captain': {
      if (s.flags['ch2_boss']) {
        return {
          lines: [
            { who: '船長 鄂倫', text: '洞窟裡的守衛解決了？了不起。' },
            { who: '船長 鄂倫', text: '東邊的沙原最近也熱得不像話，路上小心。' },
            { who: '船長 鄂倫', text: '要回暮色港的話，跟我說一聲。' }
          ],
          choices: [
            { text: '搭船回暮色港', action: 'travel:harbor:10:1' },
            { text: '先不用' }
          ]
        };
      }
      return {
        lines: [
          { who: '船長 鄂倫', text: '霜華港往北就是雪原，往東走會接到沙原。' },
          { who: '船長 鄂倫', text: '雪原上的幻獸不好惹，別一個人亂闖。' }
        ]
      };
    }

    case 'frost_shop':
      return {
        lines: [
          { who: '道具商 裘恩', text: '霜之國的東西比較貴，但都耐寒。' },
          { who: '道具商 裘恩', text: '解毒草一定要帶，雪原上的毒牙可兇了。' }
        ],
        choices: [
          { text: '看看商品', action: 'shop' },
          { text: '把我恢復一下', action: 'heal' },
          { text: '先不用' }
        ]
      };

    case 'frost_medic':
      return {
        lines: [
          { who: '醫者 瑟拉', text: '來，把手伸出來。凍傷可不是小事。' },
          { who: '醫者 瑟拉', text: '你的幻獸我都看過了，沒問題。' }
        ],
        action: 'heal'
      };

    case 'snow_hunter':
      return {
        lines: [
          { who: '獵人 芬', text: '雪原中間那片池子結了冰，走橋最安全。' },
          { who: '獵人 芬', text: '還有，別往北邊的洞窟太深處去……那裡的「守衛」醒了。' }
        ]
      };

    case 'snow_shop':
      return {
        lines: [{ who: '雪原商人', text: '在這種地方做生意，靠的是膽子。' }],
        choices: [
          { text: '看看商品', action: 'shop' },
          { text: '先不用' }
        ]
      };

    case 'ice_scholar':
      return {
        lines: [
          { who: '學者 伊蓮', text: '這裡的冰晶，比十年前暗了一半。' },
          { who: '學者 伊蓮', text: '深處那個巨像……牠原本是守護礦脈的，現在只認得破壞。' },
          { who: '學者 伊蓮', text: '你要去的話，先讓隊伍補滿再進去。' }
        ]
      };

    case 'dune_guide':
      return {
        lines: [
          { who: '嚮導 阿薩', text: '流沙會吃人，走的時候看著地面。' },
          { who: '嚮導 阿薩', text: '往東是焰心地脈，那裡的火從來沒熄過。' },
          { who: '嚮導 阿薩', text: '往北的風空港，是唯一能上星穹神殿的地方。' }
        ]
      };

    case 'sky_engineer':
      return {
        lines: [
          { who: '技師 高登', text: '風空港的浮空石，是靠晶石的光撐起來的。' },
          { who: '技師 高登', text: '光要是滅了，這座港也會掉下去。' },
          { who: '技師 高登', text: '神殿就在上面。……我只能在這裡替你們祈禱了。' }
        ]
      };

    case 'sky_shop':
      return {
        lines: [{ who: '道具商 露卡', text: '最後的補給了，別客氣。' }],
        choices: [
          { text: '看看商品', action: 'shop' },
          { text: '先不用' }
        ]
      };

    case 'sky_medic':
      return {
        lines: [
          { who: '醫者 芙蕾', text: '上去之前，把傷都治好。' },
          { who: '醫者 芙蕾', text: '……活著回來。' }
        ],
        action: 'heal'
      };

    case 'tieshan': {
      if (s.flags['tieshan_joined']) {
        return {
          lines: [
            { who: '鐵山', text: '港口這地方，石頭比人多。' },
            { who: '鐵山', text: '要打架，算我一份。' }
          ]
        };
      }
      return {
        lines: [
          { who: '礦工老大 鐵山', text: '你就是把洞窟守衛打醒的那個小子？' },
          { who: '鐵山', text: '我在港口礦場幹了二十年。那些黑斗篷最近天天來問晶石的事。' },
          { who: '鐵山', text: '晶石是這座港的命脈。要擋住他們，光靠嘴可不行。' },
          { who: '鐵山', text: '帶上我吧。我這身骨頭，還沒鏽。' }
        ],
        action: 'recruit:hero_tieshan;flag:tieshan_joined'
      };
    }

    // ── 深淵迴廊（結局後） ──
    case 'sky_gate': {
      if (s.flags['star_ended']) {
        return {
          lines: [
            { who: '守望者 卡蘭', text: '星海那邊，你去過了嗎？' },
            { who: '卡蘭', text: '上一位從那裡回來的人說——那不是光，是接住光的地方。' },
            { who: '卡蘭', text: '……我這輩子，也算是看見了。' }
          ]
        };
      }
      if (s.flags['true_ended']) {
        if (s.flags['star5_start']) {
          return {
            lines: [
              { who: '守望者 卡蘭', text: '往東就是星海渡口。渡船一直都在等懂得許願的人。' },
              { who: '守望者 卡蘭', text: '裂縫合起來之後，海上卻浮起了新的東西——那不是壞事。' }
            ]
          };
        }
        return {
          lines: [
            { who: '守望者 卡蘭', text: '裂縫……合起來了。' },
            { who: '卡蘭', text: '我在這裡守了三十年，等的就是這一天。' },
            { who: '卡蘭', text: '不過——你往東邊的海面看。' },
            { who: '卡蘭', text: '星塵回到天上以後，海上浮起了一座渡口。上面有人影。' },
            { who: '卡蘭', text: '像我這種守著裂縫的人，是不會過去的。但你可以。' }
          ],
          choices: [
            {
              text: '搭上渡船，前往星海渡口',
              action: 'travel:starhaven:1:7;flag:star5_start;stage:15'
            },
            { text: '先在這裡待一會' }
          ]
        };
      }
      if (s.flags['ended']) {
        return {
          lines: [
            { who: '守望者 卡蘭', text: '你也在看那個裂縫嗎？' },
            { who: '卡蘭', text: '自從星塵回到天上，港的西邊就裂開一道口子。' },
            { who: '卡蘭', text: '裡面沒有風、沒有回音……只有很深的安靜。' },
            { who: '卡蘭', text: '如果你要下去，記得——帶燈，跟帶光，是兩回事。' }
          ]
        };
      }
      return {
        lines: [
          { who: '守望者 卡蘭', text: '西邊禁止靠近。風空港下面是空的，誰知道通到哪裡。' },
          { who: '卡蘭', text: '等天上那件事了結了，再說吧。' }
        ]
      };
    }

    // ── 星海渡口（真結局後） ──
    case 'star_ferry': {
      if (!s.flags['star5_start']) {
        return {
          lines: [
            { who: '渡守 星河', text: '歡迎。能走到這裡的人，身上都帶著一點光。' },
            { who: '星河', text: '這裡是星海渡口，所有迷路的星塵都會先漂到這。' },
            { who: '星河', text: '往南是星霧林，穿過彗星迴橋、碎星鍛坊，就能登上星之搖籃。' },
            { who: '星河', text: '這些藥帶著，路上用得著。' }
          ],
          action: 'flag:star5_start;stage:15;give:herb_max:3;give:ether_hi:2'
        };
      }
      if (s.flags['star_ended']) {
        return {
          lines: [
            { who: '渡守 星河', text: '星海之主，願意聽你的願望了嗎？' },
            { who: '星河', text: '……那就好。渡口的光，也跟著亮了一些。' }
          ]
        };
      }
      return {
        lines: [
          { who: '渡守 星河', text: '往南走進星霧林吧。星霧裡容易迷路，跟著光的方向。' }
        ]
      };
    }

    case 'star_shop':
      return {
        lines: [
          { who: '道具商 曜', text: '星海的東西不比陸地便宜，但都染過星光。' },
          { who: '道具商 曜', text: '看看有沒有合用的？' }
        ],
        choices: [
          { text: '看看商品', action: 'shop' },
          { text: '先不用' }
        ]
      };

    case 'star_medic':
      return {
        lines: [
          { who: '醫者 昀', text: '把手伸出來，讓我看看。' },
          { who: '醫者 昀', text: '星霧會讓人疲倦，不過你和幻獸都沒事。' }
        ],
        action: 'heal'
      };

    case 'nebula_guide':
      return {
        lines: [
          { who: '星海嚮導 澪', text: '星霧林是星塵休息的地方，牠們脾氣不壞，但被打擾會生氣。' },
          { who: '星海嚮導 澪', text: '往東過了迴橋，就是碎星鍛坊——那裡的火，是從星星上敲下來的。' },
          { who: '星海嚮導 澪', text: '如果你的幻獸資質夠好，星霧林深處還藏著會進化的血脈。' }
        ]
      };

    case 'comet_watcher':
      return {
        lines: [
          { who: '觀星者 穹', text: '你腳下這座橋，是一顆彗星睡著以後彎成的。' },
          { who: '觀星者 穹', text: '我每晚都在數橋下的星塵，可從來沒數完過。' },
          { who: '觀星者 穹', text: '東邊的鍛坊守著一隻石像，通過牠，星星的門才會開。' }
        ]
      };

    case 'forge_smith':
      return {
        lines: [
          { who: '鍛師 熔', text: '這裡的火，是從星核敲下來的。一件兵器，能淬上好幾十年。' },
          { who: '鍛師 熔', text: '星輝、星壁、流星……你要哪一種寶石，我這都有。' }
        ],
        choices: [
          { text: '看看商品', action: 'shop' },
          { text: '先不用' }
        ]
      };

    default:
      return { lines: [{ who: '？', text: '……' }] };
  }
}

// ─────────────────────────────────────────────────────────────
// 劇情戰鬥
// ─────────────────────────────────────────────────────────────
export interface ScriptedBattle {
  id: string;
  enemies: { species: string; level: number }[];
  boss: boolean;
  canFlee: boolean;
  intro: string;
  /** 戰勝後執行的動作 */
  onWin?: string;
  bg: BattleBg;
  /** 覆寫戰鬥背景音樂（未指定時：頭目 → boss，其餘 → battle） */
  music?: BgmName;
  /** 頭目階段機制（依頭目 HP 比例觸發） */
  phases?: BattlePhaseDef[];
}

/** 頭目階段：血量低於門檻時的增援 / 狂暴 / 回復 */
export interface BattlePhaseDef {
  /** 頭目 HP 低於此比例（0~1）時觸發 */
  hpBelow: number;
  message: string;
  summon?: { species: string; level: number }[];
  enrage?: { stat: 'atk' | 'def' | 'mag' | 'spd' | 'hp' | 'mp'; amount: number; turns: number }[];
  healRatio?: number;
}

/** 戰鬥背景 */
export type BattleBg = 'field' | 'cave' | 'road' | 'harbor' | 'snow' | 'volcano' | 'sky' | 'abyss' | 'star' | 'forge';

export const SCRIPTED_BATTLES: Record<string, ScriptedBattle> = {
  hound: {
    id: 'hound',
    enemies: [
      { species: 'glimmermouse', level: 2 },
      { species: 'dusthare', level: 3 }
    ],
    boss: false,
    canFlee: true,
    intro: '一群眼神混濁的幻獸擋住了去路！',
    onWin: 'flag:ch1_battle;stage:2',
    bg: 'field'
  },
  hound2: {
    id: 'hound2',
    enemies: [
      { species: 'shadowwolf', level: 4 },
      { species: 'glimmermouse', level: 3 }
    ],
    boss: false,
    canFlee: true,
    intro: '一道漆黑的影子從草叢間撲了出來！',
    onWin: 'flag:ch1_battle',
    bg: 'field'
  },
  warden: {
    id: 'warden',
    enemies: [{ species: 'crystalwarden', level: 11 }],
    boss: true,
    canFlee: false,
    intro: '洞窟深處，巨大的晶石造物睜開了眼——「侵入者……排除……」',
    onWin: 'flag:ch3_warden;stage:4',
    bg: 'cave'
  },
  sect: {
    id: 'sect',
    enemies: [
      { species: 'shadowwolf', level: 12 },
      { species: 'galehawk', level: 11 }
    ],
    boss: false,
    canFlee: true,
    intro: '黑斗篷的男子笑了：「去吧，讓牠替我們問候你。」',
    onWin: 'flag:ch4_sect;stage:5',
    bg: 'road'
  },
  final: {
    id: 'final',
    enemies: [
      { species: 'sectleader', level: 16 },
      { species: 'shadowwolf', level: 14 }
    ],
    boss: true,
    canFlee: false,
    intro: '瓦倫張開雙臂：「來吧——讓這片海，聽見幻獸齊鳴的聲音。」',
    onWin: 'flag:ch1_done;stage:6',
    bg: 'harbor'
  },

  // ── 第二章 ──
  snowpack: {
    id: 'snowpack',
    enemies: [
      { species: 'frostfang', level: 13 },
      { species: 'snowpup', level: 12 },
      { species: 'snowpup', level: 12 }
    ],
    boss: false,
    canFlee: true,
    intro: '雪原上的狼群圍了上來，牠們的眼中同樣映著暗影。',
    onWin: 'flag:ch2_mid',
    bg: 'snow'
  },
  icegolem: {
    id: 'icegolem',
    enemies: [
      { species: 'icegolem', level: 19 },
      { species: 'frostwyrm', level: 16 }
    ],
    boss: true,
    canFlee: false,
    intro: '冰晶巨像緩緩站起，胸口的心核發出刺骨的藍光——「排除……侵入者……」',
    onWin: 'flag:ch2_boss;stage:9',
    bg: 'snow'
  },

  // ── 第三章 ──
  duneambush: {
    id: 'duneambush',
    enemies: [
      { species: 'dunejackal', level: 19 },
      { species: 'sandworm', level: 20 },
      { species: 'dunejackal', level: 19 }
    ],
    boss: false,
    canFlee: true,
    intro: '沙丘下猛然鑽出蟲獸，教團的旗幟在遠處揚起。',
    onWin: 'flag:ch3_mid',
    bg: 'volcano'
  },
  magmalord: {
    id: 'magmalord',
    enemies: [
      { species: 'magmalord', level: 24 },
      { species: 'lavadrake', level: 21 }
    ],
    boss: true,
    canFlee: false,
    intro: '岩壁裂開，熔岩魔王踏出岩漿——「這地脈的火，是教團的……」',
    onWin: 'flag:ch3_boss;stage:10',
    bg: 'volcano'
  },

  // ── 第四章 ──
  starsovereign: {
    id: 'starsovereign',
    enemies: [
      { species: 'starsovereign', level: 30 },
      { species: 'cloudserpent', level: 26 }
    ],
    boss: true,
    canFlee: false,
    intro: '星穹神殿的盡頭，巨影睜開了眼：「……你們，也來取光嗎？」',
    onWin: 'flag:ended;stage:11',
    bg: 'sky',
    phases: [
      {
        hpBelow: 0.6,
        message: '「你們的光，就借我吧。」星之霸主鱗片泛起星輝——攻擊力提升了！',
        enrage: [
          { stat: 'atk', amount: 0.3, turns: 5 },
          { stat: 'mag', amount: 0.3, turns: 5 }
        ]
      },
      {
        hpBelow: 0.3,
        message: '「……還不夠。」星穹碎片凝聚成形，兩道身影自光中降下！',
        summon: [
          { species: 'starling', level: 28 },
          { species: 'luminox', level: 28 }
        ]
      }
    ]
  },

  // ── 終盤：深淵迴廊（結局後解鎖） ──
  abyssknight: {
    id: 'abyssknight',
    enemies: [
      { species: 'abyssknight', level: 34 },
      { species: 'shadehound', level: 32 }
    ],
    boss: true,
    canFlee: false,
    intro: '漆黑的甲冑在迴廊口轉過身——「回頭吧。這裡沒有你想找的光。」',
    onWin: 'flag:abyss_enter;stage:12',
    bg: 'abyss',
    phases: [
      {
        hpBelow: 0.5,
        message: '甲冑的縫隙流出紫色霧氣——「那就一起留下吧。」一隻幽蛛自影中爬出！',
        summon: [{ species: 'gloomweaver', level: 32 }]
      }
    ]
  },
  nullbeast: {
    id: 'nullbeast',
    enemies: [{ species: 'nullbeast', level: 40 }],
    boss: true,
    canFlee: false,
    intro: '迴廊的中樞，巨大的獸影吞下了所有的回音。',
    onWin: 'flag:abyss_mid;stage:13',
    bg: 'abyss',
    phases: [
      {
        hpBelow: 0.7,
        message: '虛無獸發出無聲的咆哮，四周的光被吸了進去——狂暴化了！',
        enrage: [{ stat: 'atk', amount: 0.35, turns: 99 }]
      },
      {
        hpBelow: 0.35,
        message: '虛無獸把自己撕成兩半——兩道影子從裂口爬出！',
        summon: [
          { species: 'shadehound', level: 38 },
          { species: 'gloomweaver', level: 38 }
        ]
      },
      {
        hpBelow: 0.15,
        message: '「……不是光……是洞。」虛無獸把週遭的一切吞回自己體內。',
        healRatio: 0.15
      }
    ]
  },
  abysssovereign: {
    id: 'abysssovereign',
    enemies: [
      { species: 'abysssovereign', level: 50 },
      { species: 'voiddragon', level: 42 }
    ],
    boss: true,
    canFlee: false,
    intro: '最深處，那個存在張開了——光、聲音，連名字都被收了進去。',
    onWin: 'flag:true_ended;stage:14',
    bg: 'abyss',
    phases: [
      {
        hpBelow: 0.75,
        message: '深淵主宰的輪廓擴散開來——「你們帶來的光，剛好夠暖。」',
        enrage: [{ stat: 'atk', amount: 0.25, turns: 99 }]
      },
      {
        hpBelow: 0.5,
        message: '兩道星燼被拉了進來，成為牠的一部分。',
        summon: [
          { species: 'starwisp', level: 40 },
          { species: 'frostlich', level: 40 }
        ],
        healRatio: 0.08
      },
      {
        hpBelow: 0.25,
        message: '「那就……一起變成洞吧。」主宰的傷口癒合，並張開了最大的爪。',
        healRatio: 0.2,
        enrage: [{ stat: 'mag', amount: 0.4, turns: 99 }]
      }
    ]
  },

  // ── 第五章：星海之願 ──
  nebulaswarm: {
    id: 'nebulaswarm',
    enemies: [
      { species: 'nebularat', level: 44 },
      { species: 'quasarbat', level: 45 },
      { species: 'prismspider', level: 45 }
    ],
    boss: false,
    canFlee: true,
    intro: '星霧凝出一群躁動的身影，牠們擋在林的深處，不讓任何人穿過。',
    onWin: 'flag:ch5_mid;stage:16',
    bg: 'star'
  },
  cometguardian: {
    id: 'cometguardian',
    enemies: [
      { species: 'cometlisk', level: 50 },
      { species: 'meteorfang', level: 50 },
      { species: 'astralowl', level: 50 }
    ],
    boss: true,
    canFlee: false,
    intro: '迴橋盡頭，三道光影自彗星中走出——「橋不給心不誠的人過。」',
    onWin: 'flag:ch6_mid;stage:17',
    bg: 'star',
    phases: [
      {
        hpBelow: 0.55,
        message: '彗星在牠們腳下加速——「那就像彗尾一樣，燒起來吧。」',
        enrage: [{ stat: 'spd', amount: 0.3, turns: 99 }]
      },
      {
        hpBelow: 0.3,
        message: '迴橋的星光被吸走，兩隻彗尾蜥自橋的裂縫爬出！',
        summon: [
          { species: 'cometlisk', level: 48 },
          { species: 'quasarbat', level: 48 }
        ]
      }
    ]
  },
  forgegolem: {
    id: 'forgegolem',
    enemies: [
      { species: 'forgehog', level: 52 },
      { species: 'gravitoad', level: 52 },
      { species: 'czarwyrm', level: 53 }
    ],
    boss: true,
    canFlee: false,
    intro: '鍛坊深處的爐火忽然轉白——「未經淬鍊之物，不得進入星門。」',
    bg: 'forge',
    phases: [
      {
        hpBelow: 0.6,
        message: '爐火噴出一道星焰，牠們的甲殼被燒得透紅——防禦提升了！',
        enrage: [{ stat: 'def', amount: 0.35, turns: 99 }]
      },
      {
        hpBelow: 0.3,
        message: '「那就一起入爐吧。」熔鐵在地面擴散，重力蟾自漿中浮起。',
        summon: [{ species: 'forgehog', level: 51 }],
        healRatio: 0.1
      }
    ]
  },
  starmother: {
    id: 'starmother',
    enemies: [
      { species: 'starmother', level: 60 },
      { species: 'prismwyrm', level: 55 },
      { species: 'cometlord', level: 55 }
    ],
    boss: true,
    canFlee: false,
    intro: '搖籃的最深處，那個存在張開了眼——「說吧，你的願望。我聽得見。」',
    onWin: 'flag:star_ended;stage:18',
    bg: 'star',
    music: 'finale',
    phases: [
      {
        hpBelow: 0.75,
        message: '「你的願望，比我想的還要重。」星海之主身後泛起一整個夜空——全能力提升了！',
        enrage: [
          { stat: 'atk', amount: 0.2, turns: 99 },
          { stat: 'mag', amount: 0.2, turns: 99 }
        ]
      },
      {
        hpBelow: 0.5,
        message: '兩道迷路的星塵被她拉了進來，成為護衛。',
        summon: [
          { species: 'nebulaqueen', level: 55 },
          { species: 'sunforger', level: 55 }
        ],
        healRatio: 0.08
      },
      {
        hpBelow: 0.25,
        message: '「那就把所有的光，都還給你。」星海收束，她張開了最大的懷抱。',
        healRatio: 0.18,
        enrage: [{ stat: 'spd', amount: 0.35, turns: 99 }]
      }
    ]
  }
};

/** 深淵迴廊的頭目順序（依劇情推進） */
export const ABYSS_BOSSES: { flag: string; stage: number; map: string; battle: string; need: string }[] = [
  { flag: 'abyss_enter', stage: 12, map: 'abyssgate', battle: 'abyssknight', need: '' },
  { flag: 'abyss_mid', stage: 13, map: 'abysshall', battle: 'nullbeast', need: 'flag:abyss_enter' },
  { flag: 'true_ended', stage: 14, map: 'abyssdeep', battle: 'abysssovereign', need: 'flag:abyss_mid' }
];

export const SHOP_STOCK = [
  'sealstone',
  'herb',
  'herb_hi',
  'manadrop',
  'ether',
  'antidote',
  'phoenix',
  'smoke',
  'bomb',
  'warpwing',
  'elixir',
  'bomb_hi',
  'stone_purify',
  'stone_rend',
  'stone_icebind',
  'stone_regen',
  'stone_warcry',
  'stone_aegis',
  // 裝備：武器
  'weapon_iron',
  'weapon_staff',
  'weapon_claw',
  'weapon_abyss',
  // 裝備：防具
  'armor_leather',
  'armor_scale',
  'armor_robe',
  'armor_abyss',
  // 裝備：飾品
  'acc_swift',
  'acc_vital',
  'acc_ward',
  'acc_orb',
  'acc_crown',
  'acc_abyss',
  // 強化素材
  'stardust_core',
  'star_core',
  // 鑲嵌寶石
  'gem_power',
  'gem_mana',
  'gem_vital',
  'gem_guard',
  'gem_swift',
  'gem_pure',
  'gem_ward',
  'gem_element',
  // 星海道具（第五彈）
  'herb_max',
  'ether_hi',
  'antidote_hi',
  'phoenix_hi',
  'elixir_hi',
  'bomb_mega',
  'weapon_star',
  'weapon_comet',
  'armor_star',
  'armor_nebula',
  'acc_star',
  'acc_comet',
  'gem_nova',
  'gem_astral',
  'gem_bulwark',
  'gem_quick'
];
