<script setup>
import { ref, onMounted, watch, nextTick, computed } from 'vue';
import * as APIs from '@/APIs';
import '@/../scss/main.scss';
import Player from '@vimeo/player';
import Swal from 'sweetalert2';

const isBrowser = typeof window !== 'undefined';
const screenWidth = ref(isBrowser ? window.innerWidth : 0);

const DEFAULT_UNIT_HISTORY = Object.freeze({
  progress: 0,
  last_watched_at: null,
  completed: false,
});

const getStoredCourseHistory = () => {
  if (!isBrowser) {
    return {};
  }

  const history = window.localStorage.getItem('courseHistory');

  if (!history) {
    return {};
  }

  try {
    return JSON.parse(history);
  } catch (error) {
    console.error('courseHistory 解析失敗:', error);
    window.localStorage.removeItem('courseHistory');

    return {};
  }
};

const persistCourseHistory = (history) => {
  if (!isBrowser) {
    return;
  }

  try {
    window.localStorage.setItem('courseHistory', JSON.stringify(history));
  } catch (error) {
    console.error('courseHistory 寫入失敗:', error);
  }
};

const ensureHistoryEntry = (history, chapterId, unitId) => {
  if (!history[chapterId]) {
    history[chapterId] = {};
  }

  if (!history[chapterId][unitId]) {
    history[chapterId][unitId] = { ...DEFAULT_UNIT_HISTORY };
  }

  return history;
};

const props = defineProps({
  vimeoPlayerProp: [Array, Object],
});

const emit = defineEmits(['vimeoPlayerEmit', 'unitChanged']);

const initializePlayerStatus = ref(false);

const stretchPlayer = () => {
  sidebarOpen.value = !sidebarOpen.value;
  emit('vimeoPlayerEmit', sidebarOpen.value);
};

const loading = ref(true);

const VIDEO_LOAD_TIMEOUT = 15000;
const VIDEO_RETRY_DELAY = 1500;
const MAX_VIDEO_RETRIES = 3;

const networkIssue = ref(false);
const networkIssueMessage = ref('');
const isRetryingVideo = ref(false);
const defaultNetworkMessage = '偵測到網路連線不穩定，請檢查網路狀態或稍後再試。';

// 可變的狀態
const currentChapterId = ref(props.vimeoPlayerProp.chapterId);
const currentUnitId = ref(props.vimeoPlayerProp.unitId);
const currentVimeoId = ref(props.vimeoPlayerProp.vimeoId);
const currentUlId = ref(props.vimeoPlayerProp.ulId);
// 響應式變數
const isPlaying = ref(false); // 是否正在播放
const showControlsFlag = ref(false); // 控制按鈕顯示/隱藏
const showLoadingIcon = ref(false); // 控制按鈕顯示/隱藏
const sidebarOpen = ref(false);
// 定義響應式變數，預設為第一個 Tab
const activeTab = ref('units');

let totalDuration = 0;
const localHistory = ref(getStoredCourseHistory());

let player;
let suppressPromptForManualSelection = false;

const computeUnitMeta = (unitId) => {
  const chapters = props.vimeoPlayerProp?.course?.chapters ?? [];

  for (const chapter of chapters) {
    const units = chapter?.units ?? [];

    for (let idx = 0; idx < units.length; idx++) {
      const unit = units[idx];

      if (Number(unit?.id) === Number(unitId)) {
        return {
          label: `單元${idx + 1}`,
          title: unit?.title ?? '',
        };
      }
    }
  }

  return {
    label: '',
    title: '',
  };
};

const resolveUnitDuration = (unitId) => {
  const chapters = props.vimeoPlayerProp?.course?.chapters ?? [];

  for (const chapter of chapters) {
    const units = chapter?.units ?? [];

    for (const unit of units) {
      if (Number(unit?.id) === Number(unitId)) {
        return Number(unit?.duration ?? 0);
      }
    }
  }

  return totalDuration;
};

const currentUnitMeta = computed(() => computeUnitMeta(currentUnitId.value));

const currentUnitLabel = computed(() => {
  const parts = [currentUnitMeta.value.label, currentUnitMeta.value.title].filter(Boolean);

  return parts.join(' - ');
});

// 儲存所有已完成單元 ID 的陣列
const completedUnits = ref(new Set());

/**
 * 初始化已完成單元列表
 */
const initializeCompletedUnits = () => {
  const courseHistory = props.vimeoPlayerProp?.courseHistory ?? [];

  courseHistory.forEach((item) => {
    if (item?.completed) {
      completedUnits.value.add(item.unit_id);
    }
  });
};

// 切換播放/暫停
const togglePlayPause = async () => {
  try {
    if (!player) {
      console.warn('Vimeo 播放器尚未初始化，無法切換播放狀態');
      return;
    }

    if (isPlaying.value) {
      await player.pause();
      isPlaying.value = false;
    } else {
      await player.play();
      isPlaying.value = true;
    }
  } catch (error) {
    console.error('播放/暫停操作失敗:', error);
  }
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

const wait = (duration = 1000) => new Promise((resolve) => setTimeout(resolve, duration));

const withTimeout = (
  promise,
  { timeout = VIDEO_LOAD_TIMEOUT, timeoutMessage = '操作逾時' } = {},
) => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, timeout);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
};

const normalizeVimeoId = (videoId) => {
  const numericId = Number(videoId);

  return Number.isNaN(numericId) ? videoId : numericId;
};

const setNetworkIssue = async (message = defaultNetworkMessage) => {
  networkIssue.value = true;
  networkIssueMessage.value = message;

  if (typeof ElNotification !== 'undefined') {
    await ElNotification.warning({
      title: '網路連線異常',
      message,
      offset: 100,
    });
  }
};

const clearNetworkIssue = () => {
  networkIssue.value = false;
  networkIssueMessage.value = '';
};

const loadVideoWithRetry = async (videoId) => {
  let attempt = 0;

  if (!player) {
    throw new Error('Vimeo 播放器尚未初始化');
  }

  while (attempt < MAX_VIDEO_RETRIES) {
    try {
      await withTimeout(player.loadVideo(normalizeVimeoId(videoId)), {
        timeoutMessage: '影片載入逾時，請稍後再試。',
      });
      clearNetworkIssue();

      return;
    } catch (error) {
      attempt++;
      console.error('影片載入失敗，準備重試:', error);

      if (attempt >= MAX_VIDEO_RETRIES) {
        await setNetworkIssue('影片載入失敗，請檢查網路狀態或稍後再試。');

        throw error;
      }

      await wait(VIDEO_RETRY_DELAY * attempt);
    }
  }
};

const retryCurrentVideo = async () => {
  isRetryingVideo.value = true;
  showLoading();

  try {
    if (!player) {
      await initializePlayer();

      if (!player) {
        await setNetworkIssue('播放器尚未就緒，請稍後再試。');
        return;
      }
    } else {
      await player.unload();
    }

    await loadVideoWithRetry(currentVimeoId.value);
    hideControls();
    clearNetworkIssue();
  } catch (error) {
    console.error('重新載入影片失敗:', error);
  } finally {
    isRetryingVideo.value = false;
    hideLoading();
  }
};

const emitUnitChanged = (payload = {}) => {
  emit('unitChanged', {
    chapterId: currentChapterId.value,
    unitId: currentUnitId.value,
    vimeoId: currentVimeoId.value,
    title: payload.title ?? null,
    label: payload.label ?? null,
  });
};

const handleAutoContinuePrompt = async () => {
  if (suppressPromptForManualSelection) {
    suppressPromptForManualSelection = false;

    return false;
  }

  try {
    const result = await loadUnit({ direction: 'next', silent: true });

    if (!result?.unit) {
      return false;
    }

    // TODO: 需要播放下一段影片警示功能時再開啟註解
    // const nextUnit = result.unit;
    // const isSameChapter = Number(nextUnit.chapter) === Number(currentChapterId.value);
    // const confirmButtonText = isSameChapter ? '繼續下一單元' : '前往下一章';
    //
    // const payload = computeUnitMeta(nextUnit.id);
    // const { isConfirmed } = await Swal.fire({
    //   title: isSameChapter ? '播放下一單元' : '播放下一章節',
    //   html: `
    //     <div class="flex flex-col items-center gap-4">
    //       <i class="ri-play-circle-fill text-secondary text-5xl"></i>
    //       <p class="text-card-description font-bold">
    //         ${
    //           isSameChapter
    //             ? '本章節仍有未觀看的單元，是否繼續播放下一單元？'
    //             : '本章節已播放完畢，是否繼續播放下一章節？'
    //         }
    //       </p>
    //     </div>
    //   `,
    //   icon: false,
    //   showCancelButton: true,
    //   confirmButtonText,
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
    //   await updateUnit({ direction: 'next', payload });
    //   try {
    //     if (player) {
    //       await player.play();
    //     }
    //   } catch (error) {
    //     console.error('自動播放下一單元失敗:', error);
    //   }
    //
    //   return true;
    // }

    showControls();

    return false;
  } catch (error) {
    console.error('自動播放提示處理失敗:', error);

    return false;
  }
};

/**
 * 標記單元為已完成
 * @param {number} unitId - 單元 ID
 */
const markUnitAsCompleted = (unitId) => {
  completedUnits.value.add(unitId); // 將已完成單元加入列表
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
  let retryCount = 0;

  while (retryCount < MAX_VIDEO_RETRIES) {
    try {
      player = new Player('vimeo-player', {
        id: normalizeVimeoId(currentVimeoId.value),
        responsive: true,
        autoplay: false,
      });
      await withTimeout(player.ready(), {
        timeoutMessage: '影片初始化逾時，請稍後再試。',
      });
      initializePlayerStatus.value = true;
      showControlsFlag.value = true;
      isPlaying.value = false;
      clearNetworkIssue();

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

      player.on('pause', async () => {
        isPlaying.value = false;

        try {
          await syncCourseHistoryToBackend();
          showControls();
        } catch (error) {
          console.error('同步播放紀錄處理失敗:', error);
        }
      });

      player.on('timeupdate', (data) => {
        updateCourseHistory(data.seconds, totalDuration);
      });

      player.on('ended', () => {
        markUnitAsCompleted(currentUnitId.value);
        handleAutoContinuePrompt();
      });

      player.on('error', async (error) => {
        console.error('Vimeo 播放發生錯誤:', error);
        await setNetworkIssue('影片播放時發生錯誤，請檢查網路連線後再試。');
      });

      player.on('bufferstart', showLoading);
      player.on('bufferend', hideLoading);

      // 初始化已完成單元列表
      initializeCompletedUnits();

      return; // 初始化成功，退出循環
    } catch (error) {
      console.error(`播放器初始化失敗，重試次數: ${retryCount + 1}`, error);
      retryCount++;

      initializePlayerStatus.value = false;
      showControlsFlag.value = true;
      isPlaying.value = false;

      if (player && typeof player.destroy === 'function') {
        try {
          await player.destroy();
        } catch (destroyError) {
          console.error('銷毀播放器時發生錯誤:', destroyError);
        } finally {
          player = null;
        }
      }

      if (retryCount >= MAX_VIDEO_RETRIES) {
        await setNetworkIssue('影片初始化失敗，請檢查網路狀態或稍後再試。');
      } else {
        await wait(VIDEO_RETRY_DELAY * retryCount);
      }
    }
  }

  throw new Error('Vimeo 播放器初始化失敗');
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
  const normalizedChapterId = Number(chapterId);
  const normalizedUnitId = Number(unitId);
  let playerHistory = { ...DEFAULT_UNIT_HISTORY };

  try {
    const response = await APIs.unlock.vimeo.fetchUnitHistory(
      route('platform.courses.history.fetch', {
        course_id: Number(props.vimeoPlayerProp.course.id),
        chapter_id: normalizedChapterId,
        unit_id: normalizedUnitId,
      }),
    );

    const serverRecord = response?.data;

    if (serverRecord) {
      playerHistory = {
        progress: Number(serverRecord.progress ?? 0),
        last_watched_at: serverRecord.last_watched_at ?? null,
        completed: Boolean(serverRecord.completed),
      };
    }
  } catch (error) {
    console.error('從後端抓取播放紀錄失敗', error);
  }

  try {
    const history = ensureHistoryEntry(
      getStoredCourseHistory(),
      normalizedChapterId,
      normalizedUnitId,
    );
    history[normalizedChapterId][normalizedUnitId] = playerHistory;
    persistCourseHistory(history);
    localHistory.value = history;
  } catch (storageError) {
    console.error('更新本地播放紀錄時失敗:', storageError);
  }

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

  try {
    const storedHistory = ensureHistoryEntry(getStoredCourseHistory(), chapterId, unitId);
    storedHistory[chapterId][unitId] = {
      progress: Number(progress || 0),
      last_watched_at: new Date().toISOString(),
      completed: Number(progress || 0) >= Number(totalDuration || 0),
    };

    persistCourseHistory(storedHistory);
    localHistory.value = storedHistory;
  } catch (error) {
    console.error('更新播放紀錄時失敗:', error);
  }
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
const syncCourseHistoryToBackend = async () => {
  const chapterId = Number(currentChapterId.value);
  const unitId = Number(currentUnitId.value);

  const courseHistory = localHistory.value || {};
  // 確認是否有對應的 chapterId 和 unitId 的播放紀錄
  if (courseHistory[chapterId] && courseHistory[chapterId][unitId]) {
    const historyData = courseHistory[chapterId][unitId];
    // 傳遞給後端的資料
    const payload = {
      course_id: Number(props.vimeoPlayerProp.course.id), // 將 courseId 轉為數字
      chapter_id: Number(chapterId), // 將 chapterId 轉為數字
      unit_id: Number(unitId), // 將 unitId 轉為數字
      progress: Number(historyData.progress ?? 0),
      last_watched_at: historyData.last_watched_at ?? new Date().toISOString(),
      completed: Boolean(historyData.completed ?? 0),
    };

    try {
      await APIs.unlock.vimeo.syncCourseHistoryToBackend(
        route('platform.courses.history.sync'),
        payload,
      );
    } catch (error) {
      console.error('同步播放紀錄失敗:', error);
      await setNetworkIssue('同步播放紀錄失敗，請檢查網路狀態後再試。');
    }
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
const updateUnit = async ({ direction = null, unitId = currentUnitId.value, payload = null }) => {
  if (direction === null && Number(unitId) !== Number(currentUnitId.value)) {
    suppressPromptForManualSelection = true;
  }
  hideControls();
  showLoading();

  try {
    const res = await loadUnit({ direction, unitId });

    if (!res) {
      return;
    }

    const { unit } = res;

    currentChapterId.value = unit.chapter;
    currentUnitId.value = unit.id;
    currentVimeoId.value = unit.vimeoId;
    totalDuration = unit.duration;
    emitUnitChanged(payload ?? computeUnitMeta(currentUnitId.value));

    if (!player) {
      await initializePlayer();
      hideControls();
      clearNetworkIssue();

      return;
    }

    await player.unload();
    await loadVideoWithRetry(currentVimeoId.value);
    hideControls();
    clearNetworkIssue();
  } catch (error) {
    console.error('切換單元時載入影片失敗:', error);
    await setNetworkIssue('切換單元時無法載入影片，請檢查網路狀態後重試。');
  } finally {
    hideLoading();
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
    await setNetworkIssue('無法載入單元，請檢查網路狀態後再試。');
    console.error('單元載入失敗:', error);
    return null;
  }
};

onMounted(async () => {
  await nextTick();

  try {
    await initializePlayer();
  } catch (error) {
    console.error('初始化播放器時發生錯誤:', error);
    await setNetworkIssue('初始化播放器失敗，請檢查網路狀態後再試。');
  }
});

watch(
  isPlaying,
  (newVal) => {
    showControlsFlag.value = !newVal;
  },
  { immediate: true },
);

watch(
  () => [
    props.vimeoPlayerProp?.chapterId,
    props.vimeoPlayerProp?.unitId,
    props.vimeoPlayerProp?.vimeoId,
  ],
  ([chapterId, unitId, vimeoId]) => {
    if (!unitId) {
      return;
    }

    const chapterChanged = Number(chapterId) !== Number(currentChapterId.value);
    const unitChanged = Number(unitId) !== Number(currentUnitId.value);
    const vimeoChanged = `${vimeoId ?? ''}` !== `${currentVimeoId.value ?? ''}`;

    if (!chapterChanged && !unitChanged && !vimeoChanged) {
      return;
    }

    currentChapterId.value = chapterId ?? currentChapterId.value;
    currentUnitId.value = unitId ?? currentUnitId.value;
    currentVimeoId.value = vimeoId ?? currentVimeoId.value;
    totalDuration = resolveUnitDuration(unitId);

    showControlsFlag.value = true;
    isPlaying.value = false;
  },
);
</script>
<template>
  <div class="w-full">
    <div
      v-if="currentUnitLabel"
      class="text-primary border-primary text-card-title mb-5 border-b-2 px-5 pb-3 pt-5 text-start"
    >
      {{ currentUnitLabel }}
    </div>
    <div
      v-if="!initializePlayerStatus"
      class="loading-background bg-light-brown flex w-full flex-col items-center justify-center pb-5"
      :style="{
        aspectRatio: '16 / 9',
      }"
    >
      <i class="ri-movie-fill text-[40px] text-white lg:text-[150px]" />
      <p class="text-card-title text-white lg:pb-5">影片載入中 請稍候</p>
    </div>

    <div class="flex w-full flex-col items-center justify-center">
      <div
        id="videoContainer"
        class="relative h-fit"
        :class="props.vimeoPlayerProp?.videoMode === 'vertical' ? 'w-[50%]' : 'w-full'"
      >
        <!-- Vimeo 播放器 -->
        <div
          id="vimeo-player"
          class="pointer-events-auto relative h-full w-full"
          :class="{ 'opacity-0': !initializePlayerStatus }"
        ></div>
        <div
          v-if="showControlsFlag && initializePlayerStatus && !isPlaying"
          class="pointer-events-auto absolute left-0 top-0 z-10 flex h-full w-full items-center justify-center"
          :class="{ 'bg-black/10 backdrop-blur-sm': showControlsFlag }"
        >
          <button
            @click.stop="togglePlayPause"
            class="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full bg-black text-white shadow-lg hover:bg-primary-500 focus:outline-none md:h-14 md:w-14 lg:h-16 lg:w-16"
          >
            <i v-show="!isPlaying" class="ri-play-fill text-xl md:text-2xl lg:text-3xl"></i>
          </button>
          <button
            @click.stop="stretchPlayer"
            class="absolute right-0 top-1/2 hidden -translate-y-1/2 transform items-center justify-center rounded-l bg-white py-1 text-gray-500 shadow-md md:z-20 md:flex"
          >
            <i class="ri-arrow-left-s-line text-xl" v-show="!sidebarOpen"></i>
            <i class="ri-arrow-right-s-line text-xl" v-show="sidebarOpen"></i>
          </button>
        </div>
      </div>

      <div
        v-if="networkIssue"
        class="mt-4 w-full rounded-md border border-yellow-200 bg-yellow-50 p-3 text-yellow-900"
      >
        <div class="flex flex-col items-center justify-center gap-3 lg:flex-row lg:justify-between">
          <p class="text-center text-sm font-medium">
            {{ networkIssueMessage || '偵測到網路連線不穩定，請稍後再試。' }}
          </p>
          <button
            class="text-secondary text-sm font-semibold transition hover:underline disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
            @click="retryCurrentVideo"
            :disabled="isRetryingVideo"
          >
            {{ isRetryingVideo ? '重新嘗試中…' : '重新嘗試載入' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
