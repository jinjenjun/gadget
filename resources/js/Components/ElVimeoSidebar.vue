<script setup>
import { onMounted, ref, watch } from 'vue';
import * as APIs from '@/APIs';
import * as helpers from '@/Libs/helpers.js';
import '@/../scss/main.scss';
import Player from '@vimeo/player';
import Swal from 'sweetalert2';

const props = defineProps({
  vimeoSidebarProp: [Array, Object],
});

const emit = defineEmits(['unitChanged']);

const titleTransfer = (name, title) =>
  name && title ? `${name} | ${title}` : name || title || '尚無資料';

/**
 * 格式化單元的時長
 *
 * @function formatUnitDuration
 * @description 將單元的時長從秒格式化為 "HH:MM:SS" 格式的時間字串。
 * 如果輸入無效（如非數字或小於等於 0），則返回 "00:00:00"。
 * @param {number} duration - 單元的時長（以秒為單位）。
 * @returns {string} 格式化後的時間字串，例如 "01:30:45"；若輸入無效，則返回 "00:00:00"。
 *
 * @example
 * formatUnitDuration(3661); // "01:01:01"
 * formatUnitDuration(45);   // "00:00:45"
 * formatUnitDuration(-10);  // "00:00:00"
 * formatUnitDuration('abc'); // "00:00:00"
 */

const formatUnitDuration = (duration) => {
  if (isNaN(duration) || duration <= 0) {
    return '00:00:00';
  }

  const hours = Math.floor(duration / 3600)
    .toString()
    .padStart(2, '0');
  const minutes = Math.floor((duration % 3600) / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (duration % 60).toString().padStart(2, '0');

  return `${hours}:${minutes}:${seconds}`;
};

const chapterTransfer = (chapter) =>
  chapter
    ? chapter.map((item, index) => ({
        chapterId: item?.id || '',
        chapterIndex: index + 1 || 1,
        chapterTitle: item?.title || '',
        chapterDuration: item?.chapter_duration || 0,
        chapterUnitCount: item?.unit_count || 0,
        chapterUnit:
          item?.units?.map((unit, index) => ({
            unitId: unit?.id || '',
            unitIndex: index + 1 || 1,
            unitTitle: unit?.title || '',
            unitDuration: formatUnitDuration(unit?.duration),
          })) || [],
        purchaseHistory: item?.purchaseHistory || [],
      }))
    : [];

const handleChange = (val) => {
  return val;
};

const getUnitSum = (data) => {
  if (!Array.isArray(data) || !data.length) return '無資料';

  const unitSum = data.reduce((sum, item) => sum + (item.units?.length || 0), 0);
  return unitSum > 999 ? '999+ 單元' : `${unitSum} 單元`;
};

const courseData = ref({
  id: props.vimeoSidebarProp?.course?.id || '',
  route: `/courses/classroom/${props.vimeoSidebarProp.course.ulid}`,
  image: props.vimeoSidebarProp?.course?.coverUrl || '',
  title: titleTransfer(props.vimeoSidebarProp?.course?.name, props.vimeoSidebarProp?.course?.title),
  description: props.vimeoSidebarProp?.course?.detail?.product_desc || '',
  tag: props.vimeoSidebarProp?.course?.categoryName || '',
  teacher: {
    name: props.vimeoSidebarProp?.course?.teacher?.name || '',
    description: props.vimeoSidebarProp?.course?.teacher?.profile || '',
  },
  salesPrice: props.vimeoSidebarProp?.course?.sales_price || '',
  listPrice: props.vimeoSidebarProp?.course?.list_price || '',
  summaryBar: [
    {
      title: '課程長度',
      content: props.vimeoSidebarProp?.course?.formattedDuration || '尚無資料',
      icon: 'ri-discuss-line',
    },
    {
      title: '預計單元',
      content: getUnitSum(props.vimeoSidebarProp?.course?.chapters),
      icon: 'ri-pages-line',
    },
    {
      title: '觀看時限',
      content: helpers.transferUTC(props.vimeoSidebarProp?.course?.end_date),
      icon: 'ri-calendar-schedule-line',
    },
    {
      title: '開課時間',
      content: props.vimeoSidebarProp?.course?.start_date || '尚無資料',
      icon: 'ri-time-line',
    },
  ],
  chapterContent: chapterTransfer(props.vimeoSidebarProp?.course?.chapters),
  classroomRoute: `/courses/classroom/${props.vimeoSidebarProp?.course?.ulid}`,
});

const lastPlayingChapter = ref({
  chapterId: '',
  unitId: '',
  vimeoId: '',
  duration: '',
  chapterIndex: '',
  chapterTitle: '',
  unitIndex: '',
  unitTitle: '',
});

const activeNames = ref('');

// 可變的狀態
const currentChapterId = ref(props.vimeoSidebarProp.chapterId);
const currentUnitId = ref(props.vimeoSidebarProp.unitId);
const currentVimeoId = ref(props.vimeoSidebarProp.vimeoId);
const currentUlId = ref(props.vimeoSidebarProp.ulId);
// 響應式變數
const isPlaying = ref(false); // 是否正在播放
const showControlsFlag = ref(false); // 控制按鈕顯示/隱藏
const showLoadingIcon = ref(false); // 控制按鈕顯示/隱藏
// 定義響應式變數，預設為第一個 Tab
const activeTab = ref('units');

let totalDuration = 0;
const localHistory = ref({
  progress: 0,
  last_watched_at: null,
  completed: false,
});

let player;

// 儲存所有已完成單元 ID 的陣列
const completedUnits = ref(new Set());

const replaceCompletedUnits = (unitIds = []) => {
  const normalized = unitIds.map((id) => Number(id)).filter((id) => Number.isInteger(id) && id > 0);

  completedUnits.value = new Set(normalized);
};

const addCompletedUnit = (unitId) => {
  const normalizedId = Number(unitId);

  if (!Number.isInteger(normalizedId) || normalizedId <= 0) {
    return;
  }

  const nextSet = new Set(completedUnits.value);
  nextSet.add(normalizedId);
  completedUnits.value = nextSet;
};

/**
 * 初始化已完成單元列表
 */
const initializeCompletedUnits = () => {
  replaceCompletedUnits(
    props.vimeoSidebarProp.courseHistory
      .filter((item) => item.completed)
      .map((item) => item.unit_id),
  );
};

// 喚醒按鈕
const showControls = () => {
  if (showLoadingIcon.value === false) {
    showControlsFlag.value = true;
  }
};

// 隱藏按鈕
const hideControls = () => {
  showControlsFlag.value = false;
};

//顯示Loading Icon
const showLoading = () => {
  showLoadingIcon.value = true;
};

// 隱藏按鈕
const hideLoading = () => {
  showLoadingIcon.value = false;
};

// 指定單元
const changeUnit = async (unitId) => {
  await updateUnit({ unitId });
};

const emitUnitChanged = (unit) => {
  emit('unitChanged', {
    chapterId: unit?.chapter ?? null,
    unitId: unit?.id ?? null,
    vimeoId: unit?.vimeoId ?? null,
  });
};

const getUnitDisplayTitle = (unitId) => {
  let title = '';

  courseData.value.chapterContent?.forEach((chapter) => {
    chapter.chapterUnit?.forEach((unit) => {
      if (Number(unit.unitId) === Number(unitId)) {
        title = `單元${unit.unitIndex}`;
      }
    });
  });

  return title || `單元${unitId}`;
};

/**
 * 檢查單元是否已完成
 * @param {number} unitId - 單元 ID
 * @returns {boolean} 是否已完成
 */
const isUnitCompleted = (unitId) => {
  const normalizedId = Number(unitId);

  if (!Number.isInteger(normalizedId) || normalizedId <= 0) {
    return false;
  }

  return completedUnits.value.has(normalizedId);
};

/**
 * 標記單元為已完成
 * @param {number} unitId - 單元 ID
 */
const markUnitAsCompleted = (unitId) => {
  addCompletedUnit(unitId);
};

/**
 * 初始化 Vimeo 播放器並設置相關事件監聽。
 *
 * 該函式會負責清除舊的播放器事件，初始化新播放器並設置事件監聽器，如播放、暫停、
 * 時間更新等。如果初始化失敗，會自動重試最多 3 次。
 *
 * @function initializePlayer
 *
 * @throws {error} 當播放器初始化超過最大重試次數時，會拋出錯誤。
 *
 * @example
 * // 初始化播放器
 * initializePlayer();
 */
const initializePlayer = async () => {
  getUnfinishedPlayingRecord();
  updateSidebarOpenItem();
  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      player = new Player('vimeo-player', {
        id: currentVimeoId.value,
        responsive: true,
        autoplay: false,
      });

      await player.ready();

      player
        .getDuration()
        .then((duration) => {
          totalDuration = duration;
        })
        .catch((error) => {
          console.error('獲取影片時長失敗:', error);
        });

      player.on('play', () => {
        isPlaying.value = true;
      });

      player.on('pause', () => {
        isPlaying.value = false;

        try {
          syncCourseHistoryToBackend();
          isPlaying.value = false;
          showControls();
        } catch (e) {
          console.error('同步播放紀錄失敗:', e);
        }
      });

      player.on('timeupdate', (data) => {
        updateCourseHistory(data.seconds, totalDuration);
      });

      player.on('ended', () => {
        markUnitAsCompleted(currentUnitId.value);
      });

      // 初始化已完成單元列表
      initializeCompletedUnits();

      await handlePlaybackHistory(player);

      return; // 初始化成功，退出循環
    } catch (error) {
      console.error(`播放器初始化失敗，重試次數: ${retryCount + 1}`, error);
      retryCount++;
    }
  }
};

/**
 * 處理播放器的播放紀錄。
 *
 * 該函式會檢查當前章節 (chapterId) 和單元 (unitId) 的播放紀錄，並根據紀錄執行以下邏輯：
 * 1. 如果沒有播放紀錄，從頭開始播放。
 * 2. 如果播放紀錄已完成，提示使用者是否重新播放。
 * 3. 如果有部分播放進度，從進度時間繼續播放。
 *
 * 當發生任何錯誤時，會從頭開始播放。
 *
 * @async
 * @function
 * @returns {Promise<void>} 此函式無返回值。
 *
 * @example
 * // 使用範例
 * handlePlaybackHistory()
 *   .then(() => console.log('播放紀錄處理完成'))
 *   .catch((error) => console.error('播放紀錄處理失敗', error));
 *
 * @requires Swal 用於顯示提示框。
 * @requires player 用於控制播放器的播放行為。
 * @requires fetchUnitHistory 用於取得單元的播放紀錄。
 *
 * @throws {Error} 如果播放失敗或播放時間設置失敗，會在控制台打印相關錯誤。
 */

const handlePlaybackHistory = async () => {
  try {
    const normalizedDuration = Number(totalDuration ?? 0);

    const history = await fetchUnitHistory(currentChapterId.value, currentUnitId.value);
    const normalizedProgress = Number(history?.progress ?? 0);

    const unitCompleted =
      isUnitCompleted(currentUnitId.value) ||
      Boolean(history?.completed) ||
      (Number.isFinite(normalizedProgress) && Number.isFinite(normalizedDuration)
        ? normalizedProgress >= normalizedDuration && normalizedDuration > 0
        : false);

    if (!history) {
      // 如果沒有任何播放紀錄，從頭播放
      // TODO: 需要播放下一段影片警示功能時再開啟註解
      // await player.setCurrentTime(0);
      return player.play().catch((error) => {
        console.error('播放失敗:', error);
      });
    } else if (unitCompleted) {
      markUnitAsCompleted(currentUnitId.value);
      const continued = await promptNextAfterCompletion();

      if (!continued) {
        // TODO: 需要播放下一段影片警示功能時再開啟註解
        // await player.setCurrentTime(0);

        return player.play().catch((error) => {
          console.error('重新播放失敗:', error);
        });
      }
    } else if (normalizedProgress > 0) {
      await player
        .setCurrentTime(normalizedProgress)
        .then(() => {
          return player.play();
        })
        .catch((error) => {
          console.error('設定播放時間失敗:', error);
        });
    }
  } catch (error) {
    console.error('初始化播放紀錄失敗:', error);
    // 當發生錯誤時，從頭播放
    // TODO: 需要播放下一段影片警示功能時再開啟註解
    // await player.setCurrentTime(0);
    return player.play().catch((error) => {
      console.error('播放失敗:', error);
    });
  } finally {
    hideLoading();
  }
};

const promptNextAfterCompletion = async () => {
  try {
    const result = await loadUnit({ direction: 'next', silent: true });

    if (!result?.unit) {
      return false;
    }

    // TODO: 需要播放下一段影片警示功能時再開啟註解
    // const nextUnit = result.unit;
    // const isSameChapter = Number(nextUnit.chapter) === Number(currentChapterId.value);
    // const { isConfirmed } = await Swal.fire({
    //   title: isSameChapter ? '播放下一單元' : '播放下一章節',
    //   html: `
    //     <div class="flex flex-col items-center gap-4">
    //       <i class="ri-play-circle-fill text-secondary text-5xl"></i>
    //       <p class="text-card-description font-bold">${
    //         isSameChapter ? '要繼續觀看下一個單元嗎？' : '要前往下一章節繼續觀看嗎？'
    //       }</p>
    //     </div>
    //   `,
    //   icon: false,
    //   showCancelButton: true,
    //   confirmButtonText: isSameChapter ? '繼續下一單元' : '前往下一章',
    //   cancelButtonText: '暫時不要',
    //   customClass: {
    //     title: 'text-card-title lg:text-2xl',
    //     confirmButton:
    //       'text-card-description bg-secondary text-white px-5 py-2 rounded mr-2 focus:outline-none font-bold',
    //     cancelButton:
    //       'text-card-description bg-gray-200 text-gray-700 px-5 py-2 rounded focus:outline-none font-bold',
    //   },
    //   buttonsStyling: false,
    // });
    //
    // if (isConfirmed) {
    //   await updateUnit({ direction: 'next' });
    //
    //   return true;
    // }
  } catch (error) {
    console.error('下一單元提示失敗:', error);
  }

  return false;
};

/**
 * 初始化播放歷史紀錄
 *
 * @async
 * @function fetchUnitHistory
 * @description 從後端取得預設起始播放單元與課程的播放紀錄，並同步更新本地儲存。如果後端無紀錄，則初始化為預設值。
 * @returns {Promise<Object>} 返回播放器初始化使用的播放紀錄，結構如下：
 * - {number} progress - 當前單元的觀看進度（以秒為單位）。
 * - {string|null} last_watched_at - 上次觀看的時間戳，若無紀錄則為 null。
 * - {boolean} completed - 是否完成該單元。
 *
 * @example
 * const playerHistory = await fetchUnitHistory();
 * console.log(playerHistory);
 * // { progress: 120, last_watched_at: "2023-01-01T12:34:56Z", completed: false }
 */
const fetchUnitHistory = async (chapterId, unitId) => {
  //給player的紀錄
  let playerHistory;

  // 從後端抓取紀錄
  try {
    const response = await APIs.unlock.vimeo.fetchUnitHistory(
      route('platform.courses.history.fetch', {
        course_id: Number(props.vimeoSidebarProp.course.id),
        chapter_id: Number(chapterId),
        unit_id: Number(unitId),
      }),
    );

    const serverRecord = response.data;

    if (serverRecord) {
      playerHistory = {
        progress: serverRecord.progress,
        last_watched_at: serverRecord.last_watched_at,
        completed: serverRecord.completed,
      };
    } else {
      playerHistory = {
        progress: 0,
        last_watched_at: null,
        completed: false,
      };
    }

    // 更新本地儲存
    const localHistory = JSON.parse(localStorage.getItem('courseHistory')) || {};
    if (!localHistory[chapterId]) {
      localHistory[chapterId] = {};
    }
    localHistory[chapterId][unitId] = playerHistory;

    // 儲存更新後的紀錄到 localStorage
    localStorage.setItem('courseHistory', JSON.stringify(localHistory));
  } catch (error) {
    console.error('從後端抓取播放紀錄失敗', error);
    playerHistory = {
      progress: 0,
      last_watched_at: null,
      completed: false,
    };
  }
  // 返回播放器的播放紀錄
  return playerHistory;
};

/**
 * 儲存或更新特定章節和單元的進度
 *
 * @function updateCourseHistory
 * @description 此函式用於儲存或更新用戶在指定章節與單元的觀看進度，並同步到本地儲存（Local Storage）。
 * 如果進度達到或超過總時長，則會將該單元標記為完成。
 *
 * @param {number} progress - 當前單元的觀看進度（以秒為單位）。
 * @param {number} totalDuration - 單元的總時長（以秒為單位）。
 * @returns {void} 此函式無返回值。
 *
 * @example
 * // 假設章節 ID 為 101，單元 ID 為 202
 * currentChapterId = 101;
 * currentUnitId = 202;
 * updateCourseHistory(120, 300); // 觀看 120 秒，單元未完成
 * updateCourseHistory(300, 300); // 完成觀看
 */
const updateCourseHistory = (progress, totalDuration) => {
  const chapterId = Number(currentChapterId.value);
  const unitId = Number(currentUnitId.value);

  // 從 Local Storage 取得觀看紀錄
  let storedHistory = JSON.parse(localStorage.getItem('courseHistory')) || {};

  // 初始化章節資料
  if (!storedHistory[chapterId]) {
    storedHistory[chapterId] = {};
  }

  // 初始化單元資料
  if (!storedHistory[chapterId][unitId]) {
    storedHistory[chapterId][unitId] = {
      progress: 0,
      last_watched_at: null,
      completed: false,
    };
  }

  // 更新進度與其他欄位
  storedHistory[chapterId][unitId].progress = progress;
  storedHistory[chapterId][unitId].last_watched_at = new Date().toISOString();
  storedHistory[chapterId][unitId].completed = progress >= totalDuration; // 假設進度 >= 總時長代表完成

  // 更新到本地儲存
  localStorage.setItem('courseHistory', JSON.stringify(storedHistory));

  // 同步更新響應式變數
  localHistory.value = storedHistory;
};

/**
 * 同步播放器的播放紀錄到後端。
 *
 * 此函式會從 localStorage 中取得播放紀錄，並檢查當前章節 (chapterId) 和單元 (unitId)
 * 是否有對應的播放資料。若有，會整理資料後以 POST 請求同步到後端。
 *
 * 資料結構：
 * - courseHistory: 儲存在 localStorage 的 JSON 物件，包含播放紀錄。
 * - historyData: 單一單元的播放紀錄，包含 progress、last_watched_at 和 completed。
 *
 * @function
 * @returns {void} 此函式無返回值，成功時會在控制台打印同步成功訊息，失敗時會顯示錯誤。
 *
 * @example
 * // 假設 localStorage 中的 courseHistory 結構如下：
 * // {
 * //   "1": {
 * //     "10": { "progress": 50, "last_watched_at": "2025-01-22T10:00:00Z", "completed": false }
 * //   }
 * // }
 *
 * // How to use：
 * syncCourseHistoryToBackend();
 *
 * @requires axios 用於發送 HTTP 請求。
 * @throws {Error} 如果請求失敗，會在控制台打印錯誤資訊。
 */
const syncCourseHistoryToBackend = () => {
  const chapterId = Number(currentChapterId.value);
  const unitId = Number(currentUnitId.value);

  const courseHistory = JSON.parse(localStorage.getItem('courseHistory')) || {};
  // 確認是否有對應的 chapterId 和 unitId 的播放紀錄
  if (courseHistory[chapterId] && courseHistory[chapterId][unitId]) {
    const historyData = courseHistory[chapterId][unitId];
    // 傳遞給後端的資料
    const payload = {
      course_id: Number(props.vimeoSidebarProp.course.id), // 將 courseId 轉為數字
      chapter_id: Number(chapterId), // 將 chapterId 轉為數字
      unit_id: Number(unitId), // 將 unitId 轉為數字
      progress: Number(historyData.progress ?? 0),
      last_watched_at: historyData.last_watched_at ?? new Date().toISOString(),
      completed: Boolean(historyData.completed ?? 0),
    };

    // 使用 axios 發送 POST 請求
    APIs.unlock.vimeo
      .syncCourseHistoryToBackend(route('platform.courses.history.sync'), payload)
      .catch((error) => {
        console.error('播放紀錄同步失敗', error.response?.data || error.message);
      });
  } else {
    console.warn('無法同步，後端無該單元的播放紀錄');
  }
};

/**
 * 切換單元
 * @async
 * @function updateUnit
 * @description 載入前後或指定的單元，並更新player。
 * @param {Object} options - 配置參數
 * @param {('next'|'previous'|null)} [options.direction=null] - 可傳入 'next' 或 'previous'，null 時為當前單元。
 * @param {number} [options.unitId=currentUnitId.value] - 指定的單元 ID，預設為當前單元 ID。
 * @returns {Promise<void>} 無返回值
 */
const updateUnit = async ({ direction = null, unitId = currentUnitId.value }) => {
  ElNotification.success({
    title: '進行單元切換，請稍候...',
    offset: 100,
    duration: 3000,
  });
  hideControls();
  showLoading();
  // 呼叫 loadUnit，傳遞 direction 和 unitId
  const res = await loadUnit({ direction, unitId });

  if (res) {
    const { unit } = res;
    currentChapterId.value = unit.chapter;
    currentUnitId.value = unit.id;
    currentVimeoId.value = unit.vimeoId;
    totalDuration = unit.duration;
    emitUnitChanged(unit);
    getUnfinishedPlayingRecord();
    // 更新狀態
    player.unload().then(function () {
      player
        .loadVideo(currentVimeoId.value)
        .then(async function () {
          hideLoading();
          hideControls();
          initializeCompletedUnits();
          await handlePlaybackHistory();
        })
        .catch(function (error) {
          switch (error.name) {
            case 'TypeError':
              // The ID isn't a number
              break;
            case 'PasswordError':
              // The video is password-protected
              break;
            case 'PrivacyError':
              // The video is private
              break;
            default:
              // Some other error occurred
              break;
          }
        });
    });
  }
  hideLoading();
};

const getUnfinishedPlayingRecord = () => {
  lastPlayingChapter.value.chapterId = currentChapterId.value;
  lastPlayingChapter.value.unitId = currentUnitId.value;
  lastPlayingChapter.value.vimeoId = currentVimeoId.value;
  lastPlayingChapter.value.duration = totalDuration;

  courseData.value.chapterContent?.forEach((chapter) => {
    chapter.chapterUnit?.forEach((unit) => {
      if (unit.unitId === lastPlayingChapter.value.unitId) {
        lastPlayingChapter.value.chapterIndex = chapter.chapterIndex;
        lastPlayingChapter.value.chapterTitle = chapter.chapterTitle;
        lastPlayingChapter.value.unitIndex = unit.unitIndex;
        lastPlayingChapter.value.unitTitle = unit.unitTitle;
      }
    });
  });

  if (!lastPlayingChapter.value.chapterIndex) {
    setActiveChapterById(lastPlayingChapter.value.chapterId);
  }
};

const updateSidebarOpenItem = () => {
  if (lastPlayingChapter.value.chapterIndex) {
    activeNames.value = lastPlayingChapter.value.chapterIndex.toString();
  }
};

const setActiveChapterById = (chapterId) => {
  if (!chapterId) {
    return;
  }

  const chapter = courseData.value.chapterContent.find(
    (item) => Number(item.chapterId) === Number(chapterId),
  );

  if (chapter) {
    lastPlayingChapter.value.chapterIndex = chapter.chapterIndex;
    lastPlayingChapter.value.chapterTitle = chapter.chapterTitle;
    updateSidebarOpenItem();
  }
};

/**
 * 後端抓取單元資料
 * @async
 * @function loadUnit
 * @description 從後端取指定或前後unit的資料。
 * @param {Object} options - 配置參數
 * @param {('next'|'previous'|null)} [options.direction=null] - 可傳入 'next' 或 'previous'，null 時為當前單元。
 * @param {number} [options.unitId=currentUnitId.value] - 指定的單元 ID，預設為當前單元 ID。
 * @returns {Promise<Object|null>} 如果成功，返回單元資料，結構如下：
 * - {number} unit.id - 單元 ID
 * - {number} unit.chapter - 章節 ID
 * - {string} unit.title - 單元標題
 * - {string} unit.vimeoId - Vimeo 影片 ID
 * 如果失敗，返回 `null`。
 */
const loadUnit = async ({ direction = null, unitId = currentUnitId.value, silent = false }) => {
  try {
    const response = await APIs.unlock.vimeo.loadUnit(
      route('platform.courses.units.fetch', {
        course_ulid: currentUlId.value,
        unitId: unitId,
      }),
    );

    const { previousUnit, currentUnit, nextUnit } = response.data;

    // 根據 direction 決定返回哪個單元
    let unit;
    if (direction === 'previous') {
      unit = previousUnit;
    } else if (direction === 'next') {
      unit = nextUnit;
    } else {
      unit = currentUnit; // 如果沒有 direction，返回指定單元
    }

    // 檢查單元是否存在
    if (!unit) {
      if (!silent) {
        await ElNotification.warning({
          title: direction === 'previous' ? '已經是第一個單元' : '已經是最後一個單元',
          offset: 100,
        });
      }
      return null;
    }

    return { unit };
  } catch (error) {
    if (!silent) {
      await ElNotification.warning({
        title: '加載失敗',
        message: '無法載入單元，請稍後重試。',
        offset: 100,
      });
    }
    console.error('單元載入失敗:', error);
    return null;
  }
};

const isChapterPurchased = (chapter) => chapter?.purchaseHistory?.chapter?.status;

const isUnitPurchased = (chapter, unit) =>
  chapter.purchaseHistory?.unit?.some((u) => u?.id === unit?.unitId && u?.status === true);

onMounted(() => {
  initializePlayer();
});

watch(
  () => props.vimeoSidebarProp.chapterId,
  (chapterId) => {
    if (!chapterId) {
      return;
    }

    currentChapterId.value = chapterId;
    lastPlayingChapter.value.chapterId = chapterId;
    getUnfinishedPlayingRecord();
    setActiveChapterById(chapterId);
    updateSidebarOpenItem();
  },
);

watch(
  () => props.vimeoSidebarProp.unitId,
  (unitId) => {
    if (!unitId) {
      return;
    }

    currentUnitId.value = unitId;
    lastPlayingChapter.value.unitId = unitId;
    getUnfinishedPlayingRecord();
  },
);
</script>
<template>
  <div class="custom-page">
    <ElCollapse v-model="activeNames" accordion @change="handleChange">
      <ElCollapseItem
        v-for="(chapter, index) in courseData.chapterContent"
        :key="index"
        :name="chapter.chapterIndex.toString()"
      >
        <template #title>
          <div class="text-card-title flex items-start gap-1">
            <div class="flex items-center justify-start">
              <i
                class="text-secondary mr-2 w-5"
                :class="isChapterPurchased(chapter) ? '' : 'ri-lock-line'"
              />
            </div>
            <div class="flex items-start">
              <span class="wrap-break-word break-all whitespace-normal">
                {{ chapter.chapterTitle }}
              </span>
            </div>
          </div>
        </template>

        <div
          class="text-primary text-card-description flex items-start justify-start px-5 py-5 font-bold"
        >
          <p>共{{ chapter.chapterUnitCount }}個單元 | 總時長：{{ chapter.chapterDuration }}</p>
        </div>
        <div
          class="text-primary text-card-description grid grid-cols-2 gap-4 p-2 font-bold"
          v-for="(unit, index) in chapter.chapterUnit"
          :key="index"
          :class="{ 'disable-execution': !isUnitPurchased(chapter, unit) }"
        >
          <div
            class="col-span-1 flex cursor-pointer items-start justify-start hover:text-orange-400 active:scale-90"
            @click="changeUnit(unit.unitId)"
          >
            <i
              class="text-secondary mr-2 w-[16px]"
              :class="isUnitPurchased(chapter, unit) ? '' : 'ri-lock-line'"
            />
            <p
              class="mr-5 wrap-break-word break-all whitespace-normal"
              :class="{ 'text-secondary font-bold': unit.unitId === currentUnitId }"
            >
              {{ unit.unitTitle }}
            </p>
          </div>
          <div class="col-span-1 flex items-start justify-start">
            <i
              class="mr-2"
              :class="{
                'ri-play-circle-line text-secondary font-normal': unit.unitId === currentUnitId,
                'ri-checkbox-circle-fill text-secondary font-normal': isUnitCompleted(unit.unitId),
                'ri-play-circle-line font-normal':
                  !isUnitCompleted(unit.unitId) && unit.unitId !== currentUnitId,
              }"
            />
            <p>| {{ unit.unitDuration }}</p>
          </div>
        </div>
      </ElCollapseItem>
    </ElCollapse>
  </div>
</template>
<style scoped>
::v-deep(.el-collapse-item__header) {
  white-space: normal !important;
  line-height: 1.5;
  padding: 50px 0px 50px 0px !important;
}

@media screen and (min-width: 768px) and (max-width: 1023px) {
  ::v-deep(.el-collapse-item__header) {
    padding: 40px 0px 40px 0px !important;
  }
}

@media screen and (max-width: 767px) {
  ::v-deep(.el-collapse-item__header) {
    padding: 30px 0px 30px 0px !important;
  }
}
</style>
