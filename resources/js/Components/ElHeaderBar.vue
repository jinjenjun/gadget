<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { router, usePage } from '@inertiajs/vue3';
import { Howl } from 'howler';
import { useStore } from 'vuex';
import { vuexData } from '@/../store';
import '@/../scss/main.scss';
import * as APIs from '@/APIs';
import * as helpers from '@/Libs/helpers';
import ElInfoButton from '@/Components/ElInfoButton.vue';

const store = useStore();
const loginStatus = ref('會員登入');
const registerStatus = ref('註冊會員');
const loginButtonStatus = ref({ disable: false });
const isLoggingOut = ref(false);
let smallMenuStatus = false;
let memberMenuStatus = false;
let searchMenuStatus = false;

const screenWidth = ref(window.innerWidth);

const musicList = ref([
  {
    name: '歌曲1',
    url: 'https://timelesspub-storage.s3-ap-northeast-1.amazonaws.com/music/bg_music_001.mp3',
  },
]);
const currentTrackIndex = ref(0);
const isPlaylistLooping = ref(false);
const currentTrack = ref(musicList.value[currentTrackIndex.value]);
let sound = null;
const searchButtonName = ref('搜尋文章');
const searchKeyword = ref('');

const onInputSanitize = (event) => {
  searchKeyword.value = helpers.sanitizeInput(event.target.value);
  vuexData.unlock.head.setHeadTitle(store, '');
};

const updateMusicStatus = () => {
  vuexData.unlock.music.setMusicData(store, {
    trackIndex: currentTrackIndex.value,
    progress: sound.seek(),
    isPlaying: sound.playing(),
  });
};

const loadTrack = () => {
  const track = musicList.value[currentTrackIndex.value];
  currentTrack.value = track;
  sound = new Howl({
    src: [track.url],
    autoplay: false,
    loop: isPlaylistLooping.value,
    html5: true,
    onend: onTrackEnd,
  });
  sound.volume(1);
};

const onTrackEnd = () => {
  if (isPlaylistLooping.value) {
    return true;
  }
};

const togglePlaylistLoop = () => {
  isPlaylistLooping.value = !isPlaylistLooping.value;
  if (isPlaylistLooping.value) {
    loadTrack();
    sound.play();
    updateMusicStatus();
  } else {
    sound.stop();
    updateMusicStatus();
  }
};

let intervalId;

// TODO: 儲存音樂播放狀態，有需要時再開啟
const storeMusicStatus = () => {
  const musicState = vuexData.unlock.music.getMusicData(store);

  if (musicState?.trackIndex != null) {
    currentTrackIndex.value = musicState.trackIndex;
    loadTrack();
    sound.once('load', () => {
      sound.seek(musicState.progress || 0);

      if (musicState.isPlaying) {
        sound.play();
      }
    });
    isPlaylistLooping.value = musicState.isPlaying;
  } else {
    loadTrack();
  }

  intervalId = setInterval(() => {
    if (sound?.playing()) {
      vuexData.unlock.music.setMusicData(store, {
        trackIndex: currentTrackIndex.value,
        progress: sound.seek(),
        isPlaying: sound.playing(),
      });
    }
  }, 1000);
};

const page = usePage();
const cartCount = computed(() => page.props.cart?.count);

const props = defineProps({
  headerBarProp: Array,
});
const emit = defineEmits(['headerBarEmit']);
const activeTab = ref('lounge');

const routeString = window.location.pathname;
const pathParts = routeString.split('/');
const route = pathParts[1];

const memberCenterList = [
  {
    title: '會員中心',
    action: () => helpers.forwardRoute('/member'),
    dynamicText: null,
  },
  {
    title: '我的課程',
    action: () => helpers.forwardRoute('/member/courses'),
    dynamicText: null,
  },
  {
    title: '我的書櫃',
    action: () => helpers.forwardRoute('/member/bookshelf'),
    dynamicText: null,
  },
  {
    title: '背景音樂',
    action: () => togglePlaylistLoop(),
    dynamicText: () => (isPlaylistLooping.value ? '關閉' : '開啟'),
  },
];

const updateActiveTab = (tab) => {
  activeTab.value = tab.route;

  emit('headerBarEmit', activeTab.value);
};

// TODO: 桌機選單設定
const createOptionItem = () => {
  const currentPath = window.location.pathname.replace(/^\//, '');
  const targetIndex = props.headerBarProp.findIndex((item) => item.branch.includes(currentPath));
  const wrapper = document.createElement('div');
  wrapper.className = 'relative flex items-center space-x-4';

  const leftArrow = document.createElement('button');
  leftArrow.innerHTML = '<i class="ri-arrow-left-s-line text-2xl"></i>';
  leftArrow.className = props?.headerBarProp?.length > 3 ? 'text-gray-400' : 'hidden';
  leftArrow.disabled = true;

  const rightArrow = document.createElement('button');
  rightArrow.innerHTML = '<i class="ri-arrow-right-s-line text-2xl"></i>';
  rightArrow.className = props?.headerBarProp?.length > 3 ? 'text-gray-400' : 'hidden';

  let windowWidth = window.innerWidth;

  // TODO: 桌機寬度時隱藏箭頭，日後如果需要箭頭可以從這裡調整
  if (windowWidth > 1024) {
    leftArrow.className = 'hidden';
    rightArrow.className = 'hidden';
  }

  const scrollContainer = document.createElement('div');
  scrollContainer.className =
    'custom-scroll no-scroll-touch flex overflow-x-hidden whitespace-nowrap lg:gap-x-[30px] md:w-[300px] transition-all duration-300 ease-in-out';

  if (windowWidth > 1024) {
    scrollContainer.style.width = '580px';
  } else if (windowWidth === 1024) {
    scrollContainer.style.width = '420px';
  } else if (windowWidth >= 768) {
    scrollContainer.style.width = '300px';
  }

  props.headerBarProp?.forEach((item) => {
    const itemContainer = document.createElement('div');
    itemContainer.className = 'shrink-0 p-[10px] md:w-[100px] lg:w-[120px] text-center';

    const link = document.createElement('a');
    const newsType = vuexData.unlock.news.getNewsData(store)?.type;
    const pathsToMatch = [route, currentPath];
    if (route === 'news' && (newsType === 'article' || newsType === 'video')) {
      pathsToMatch.push(
        newsType === 'article' ? props.headerBarProp?.[3]?.route : props.headerBarProp?.[2]?.route,
      );
    }
    const isActiveRoute = pathsToMatch.some((path) => item.branch.includes(path));

    link.className = `block w-full overflow-hidden text-ellipsis whitespace-nowrap md:text-[18px] lg:text-2xl cursor-pointer ${
      isActiveRoute ? 'font-bold text-secondary' : 'font-normal'
    }`;

    link.textContent = item.title;
    link.href = `/${item.route}`;
    item.route === 'shop' ? (link.href = '/shop/leaderboard') : null;

    const shouldDisable = !item.active && page.props.config.env !== 'local';
    if (shouldDisable) {
      link.classList.add('disable-execution');
      link.style.cursor = 'not-allowed';
      link.style.pointerEvents = 'none';
    }

    link.addEventListener('click', (event) => {
      if (shouldDisable) {
        event.preventDefault();
        return;
      }

      updateActiveTab(item);
      scrollContainer.querySelectorAll('a').forEach((otherLink) => {
        if (!otherLink.classList.contains('disable-execution')) {
          otherLink.className =
            'block w-full overflow-hidden text-ellipsis whitespace-nowrap md:text-[18px] lg:text-2xl cursor-pointer font-normal';
        }
      });

      link.className =
        'block w-full overflow-hidden text-ellipsis whitespace-nowrap md:text-[18px] lg:text-2xl cursor-pointer font-bold text-secondary';
    });

    itemContainer.appendChild(link);
    scrollContainer.appendChild(itemContainer);
  });

  const scrollAmount = 150;
  leftArrow.addEventListener('click', () => {
    scrollContainer.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  });
  rightArrow.addEventListener('click', () => {
    scrollContainer.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  });

  scrollContainer.addEventListener('scroll', () => {
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainer;
    leftArrow.disabled = scrollLeft <= 0;
    rightArrow.disabled = scrollLeft + clientWidth >= scrollWidth - 1;
  });

  wrapper.appendChild(leftArrow);
  wrapper.appendChild(scrollContainer);
  wrapper.appendChild(rightArrow);

  setTimeout(() => {
    if (targetIndex > 2) {
      const scrollTo = (targetIndex - 2) * scrollAmount;
      scrollContainer.scrollBy({ left: scrollTo, behavior: 'smooth' });
    }
  }, 0);
  return wrapper;
};

const logoSrc =
  page.props.img && page.props.img.logo ? page.props.img.logo : '/img/unlocking_logo.png';

const logoItem =
  `
      <div class="flex grow justify-center">
        <div class="text-center">
          <a class="mr-2 text-sm lg:text-xl cursor-pointer font-normal font-bold! flex justify-center items-center" href="/">
            <img src="` +
  logoSrc +
  `" alt="" class="w-[80px] md:w-[90px] lg:w-[130px]" />
          </a>
        </div>
      </div>
    `;

const updateRightIconItem = () => {
  if (screenWidth.value < 768) {
    return `
      <div class="flex grow justify-center space-x-6 text-2xl pr-[27px]">
        <button class="member-icon hover:text-primary-500 focus:outline-none" >
          <i class="ri-account-circle-fill"></i>
        </button>
        <button onclick="" class="cart-icon hover:text-primary-500 focus:outline-none">
          <a href="/cart"><i class="ri-shopping-cart-line"></i></a>
        </button>
      </div>
    `;
  } else {
    return `
      <div class="flex grow justify-center space-x-6 text-2xl pr-[27px]">
        <button onclick="" class="search-icon hover:text-primary-500 focus:outline-none">
          <i class="ri-search-line"></i>
        </button>
        <button class="member-icon hover:text-primary-500 focus:outline-none" >
          <i class="ri-account-circle-fill"></i>
        </button>
        <button onclick="" class="cart-icon hover:text-primary-500 focus:outline-none">
          <a href="/cart"><i class="ri-shopping-cart-line"></i></a>
        </button>
      </div>
    `;
  }
};

const updateLeftIconItem = () => {
  if (screenWidth.value < 768) {
    return `
      <div class="flex grow justify-center space-x-6 text-2xl">
        <button onclick="" class="small-menu-icon hover:text-primary-500 focus:outline-none">
          <i class="ri-menu-fill"></i>
        </button>
        <button onclick="" class="search-icon hover:text-primary-500 focus:outline-none">
          <i class="ri-search-line"></i>
        </button>
      </div>
    `;
  } else {
    return true;
  }
};

const openSmallMenu = () => {
  let menuHeight = 0;
  const targetHeight = props?.headerBarProp?.length * 50 + 15;

  document.querySelector('.small-menu').style.display = 'block';
  const animateMenu = () => {
    if (menuHeight < targetHeight) {
      menuHeight += 50;
      document.querySelector('.small-menu').style.height = `${menuHeight}px`;
      requestAnimationFrame(animateMenu);
    }
  };
  animateMenu();
  smallMenuStatus = true;
  createSmallMenuOption();
};

const closeSmallMenu = () => {
  document.querySelector('.small-menu').style.display = 'none';
  document.querySelector('.small-menu-option-container').innerHTML = '';
  smallMenuStatus = false;
};

const toggleSmallMenu = () => {
  if (!smallMenuStatus) {
    openSmallMenu();
  } else {
    closeSmallMenu();
  }
};

const openMemberMenu = () => {
  let menuHeight = 0;
  const thresholds = {
    desktop: 450,
    tablet: 450,
    mobile: 450,
  };
  const menuThreshold =
    screenWidth.value >= 1024
      ? thresholds.desktop
      : screenWidth.value >= 768
        ? thresholds.tablet
        : thresholds.mobile;
  document.querySelector('.member-menu').style.display = 'block';
  const animateMenu = () => {
    if (menuHeight < menuThreshold) {
      menuHeight += 150;
      document.querySelector('.member-menu').style.height = `${menuHeight}px`;
      requestAnimationFrame(animateMenu);
    }
  };
  animateMenu();
  memberMenuStatus = true;
};

const closeMemberMenu = () => {
  document.querySelector('.member-menu').style.display = 'none';
  memberMenuStatus = false;
};

const toggleMemberMenu = () => {
  if (!memberMenuStatus) {
    openMemberMenu();
  } else {
    closeMemberMenu();
  }
};

const openSearchMenu = () => {
  let menuHeight = 0;
  const thresholds = {
    desktop: 78,
    tablet: 78,
    mobile: 78,
  };
  const menuThreshold =
    screenWidth.value >= 1024
      ? thresholds.desktop
      : screenWidth.value >= 768
        ? thresholds.tablet
        : thresholds.mobile;
  document.querySelector('.search-menu').style.display = 'block';
  const animateMenu = () => {
    if (menuHeight < menuThreshold) {
      menuHeight += 78;
      document.querySelector('.search-menu').style.height = `${menuHeight}px`;
      requestAnimationFrame(animateMenu);
    } else {
      document.querySelector('.search-menu-option-container').style.display = 'block';
    }
  };
  animateMenu();
  searchMenuStatus = true;
};

const closeSearchMenu = () => {
  document.querySelector('.search-menu-option-container').style.display = 'none';
  document.querySelector('.search-menu').style.display = 'none';
  searchMenuStatus = false;
};

const toggleSearchMenu = () => {
  if (!searchMenuStatus) {
    openSearchMenu();
  } else {
    closeSearchMenu();
  }
};

// TODO: 手機選單設定
const createSmallMenuOption = () => {
  const currentPath = window.location.pathname.replace(/^\//, '');
  const container = document.querySelector('.small-menu-option-container');
  container.innerHTML = '';

  props.headerBarProp.forEach((item) => {
    const itemContainer = document.createElement('div');
    itemContainer.className = 'p-[10px] w-[100px] text-center grow truncate break-all';

    const link = document.createElement('a');
    const newsType = vuexData.unlock.news.getNewsData(store)?.type;
    const pathsToMatch = [route, currentPath];
    if (route === 'news' && (newsType === 'article' || newsType === 'video')) {
      pathsToMatch.push(
        newsType === 'article' ? props.headerBarProp?.[3]?.route : props.headerBarProp?.[2]?.route,
      );
    }
    const isActiveRoute = pathsToMatch.some((path) => item.branch.includes(path));

    link.className = `text-[18px] cursor-pointer ${isActiveRoute ? 'font-bold text-secondary' : 'font-normal'}`;
    link.textContent = item.title;
    link.href = `/${item.route}`;
    item.route === 'shop' ? (link.href = '/shop/leaderboard') : null;

    const shouldDisable = !item.active && page.props.config.env !== 'local';
    if (shouldDisable) {
      link.classList.add('disable-execution');
      link.style.setProperty('cursor', 'not-allowed', 'important');
      link.style.pointerEvents = 'none';
    }

    link.addEventListener('click', (event) => {
      if (shouldDisable) {
        event.preventDefault();
        return;
      }

      updateActiveTab(item);

      container.querySelectorAll('a').forEach((otherLink) => {
        if (!otherLink.classList.contains('disable-execution')) {
          otherLink.className = 'text-[18px] cursor-pointer font-normal';
        }
      });

      link.className = 'text-[18px] cursor-pointer font-bold text-secondary';
    });

    itemContainer.appendChild(link);
    container.appendChild(itemContainer);
  });
};

const updateVisibleItem = () => {
  const headerContainer = document.querySelector('.header-container');
  if (!headerContainer) return;
  headerContainer.innerHTML = '';
  const leftHeaderContainer = document.createElement('div');
  leftHeaderContainer.className = 'flex justify-center items-center left-header-container';
  const middleHeaderContainer = document.createElement('div');
  middleHeaderContainer.className = 'flex justify-center items-center middle-header-container';
  const rightHeaderContainer = document.createElement('div');
  rightHeaderContainer.className = 'flex justify-center items-center right-header-container';

  if (screenWidth.value >= 1024) {
    if (smallMenuStatus) closeSmallMenu();
    leftHeaderContainer.innerHTML = logoItem;
    middleHeaderContainer.appendChild(createOptionItem());
    rightHeaderContainer.innerHTML = updateRightIconItem();
    headerContainer.appendChild(leftHeaderContainer);
    headerContainer.appendChild(middleHeaderContainer);
    headerContainer.appendChild(rightHeaderContainer);
  } else if (screenWidth.value >= 768) {
    if (smallMenuStatus) closeSmallMenu();
    leftHeaderContainer.innerHTML = logoItem;
    leftHeaderContainer.appendChild(createOptionItem());
    rightHeaderContainer.innerHTML = updateRightIconItem();
    headerContainer.appendChild(leftHeaderContainer);
    headerContainer.appendChild(rightHeaderContainer);
  } else {
    leftHeaderContainer.innerHTML = updateLeftIconItem();
    middleHeaderContainer.innerHTML = logoItem;
    rightHeaderContainer.innerHTML = updateRightIconItem();
    headerContainer.appendChild(leftHeaderContainer);
    headerContainer.appendChild(middleHeaderContainer);
    headerContainer.appendChild(rightHeaderContainer);
    document.querySelector('.small-menu-icon').addEventListener('click', () => {
      toggleSmallMenu();
    });
  }
  document.querySelector('.member-icon').addEventListener('click', () => {
    toggleMemberMenu();
  });
  document.querySelector('.search-icon').addEventListener('click', () => {
    toggleSearchMenu();
  });
  updateDropdownMenu();
};

const updateDropdownMenu = () => {
  if (screenWidth.value >= 1024) {
    if (memberMenuStatus) {
      document.querySelector('.member-menu').style.height = '450' + 'px';
    }
  } else if (screenWidth.value >= 768) {
    if (memberMenuStatus) {
      document.querySelector('.member-menu').style.height = '450' + 'px';
    }
  } else {
    if (memberMenuStatus) {
      document.querySelector('.member-menu').style.height = '450' + 'px';
    }
  }
};

const checkLoginStatus = () => {
  loginStatus.value = page.props.auth?.user ? '登出' : '會員登入';
  registerStatus.value = page.props.auth?.user ? '已註冊會員' : '註冊會員';
  loginButtonStatus.value.disable = isLoggingOut.value;
};
const checkAuthStatus = () => {
  document.querySelector('.cart-icon').style.display = page?.props?.auth?.user ? 'block' : 'none';
};

const logoutUser = async () => {
  if (isLoggingOut.value) {
    return;
  }

  isLoggingOut.value = true;
  loginButtonStatus.value.disable = true;

  const logoutRoute = typeof route === 'function' ? route('logout') : '/logout';

  try {
    await APIs.unlock.account.logout(logoutRoute);

    ElNotification.success({
      title: '登出成功',
      offset: 100,
    });

    await router.reload({ only: ['auth', 'cart'] });
    window.location.reload();
  } catch (error) {
    console.error(error);
  } finally {
    isLoggingOut.value = false;
    loginButtonStatus.value.disable = false;
  }
};

const handleLoginButtonClick = () => {
  if (isLoggingOut.value) {
    return;
  }

  if (page.props.auth?.user) {
    logoutUser();
  } else {
    helpers.forwardRoute('/login');
  }
};

const closeMenuOnOutsideClick = (e) => {
  let clickedOutsideSmallMenu =
    !e.target.closest('.small-menu') && !e.target.closest('.small-menu-icon');
  let clickedOutsideMemberMenu =
    !e.target.closest('.member-menu') && !e.target.closest('.member-icon');
  let clickedOutsideSearchMenu =
    !e.target.closest('.search-menu') && !e.target.closest('.search-icon');
  let clickedOutsideSearchBookMenu =
    !e.target.closest('.search-book-menu') && !e.target.closest('.search-icon');

  if (clickedOutsideSmallMenu) {
    smallMenuStatus = false;
    closeSmallMenu();
  }
  if (clickedOutsideMemberMenu) {
    memberMenuStatus = false;
    closeMemberMenu();
  }
  if (clickedOutsideSearchMenu) {
    searchMenuStatus = false;
    closeSearchMenu();
  }
  if (clickedOutsideSearchBookMenu) {
    searchMenuStatus = false;
  }

  if (
    clickedOutsideSmallMenu ||
    clickedOutsideMemberMenu ||
    clickedOutsideSearchMenu ||
    clickedOutsideSearchBookMenu
  ) {
    searchKeyword.value = '';
  }
};

const handleSearchButtonName = () => {
  if (route === 'lounge' || route === 'posts' || route === 'serials'|| route === 'sections' || route === 'celebrities') {
    searchButtonName.value = '搜尋專欄';
  } else if (route === 'shop' || route === 'book' || route === 'audios' || route === 'courses') {
    searchButtonName.value = '搜尋市集';
  } else {
    searchButtonName.value = '搜尋';
    document.querySelector('.search-icon').style.display = 'none';
  }
};

const searchRoute = computed(() => {
  if (route === 'lounge' || route === 'posts' || route === 'serials' || route === 'celebrities') {
    return `/posts/search/${searchKeyword.value}`;
  } else if (route === 'sections') {
    return `/sections/search/${searchKeyword.value}`;
  } else if (route === 'shop' || route === 'book') {
    return `/shop/search/${searchKeyword.value}`;
  } else if (route === 'courses') {
    return `/shop/search/${searchKeyword.value}`;
  } else if (route === 'audios') {
    return `/shop/search/${searchKeyword.value}`;
  } else {
    return '/';
  }
});

const handleSearchSubmit = () => {
  if (!searchKeyword.value) {
    return;
  }
};

const handleResize = () => {
  const currentWidth = window.innerWidth;
  if (currentWidth === screenWidth.value) return;
  screenWidth.value = currentWidth;
  updateVisibleItem();
  handleSearchButtonName();
};

onMounted(() => {
  searchKeyword.value = '';
  updateVisibleItem();
  checkAuthStatus();
  checkLoginStatus();
  handleSearchButtonName();
  // storeMusicStatus();
  document.addEventListener('click', closeMenuOnOutsideClick);
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', closeMenuOnOutsideClick);
  window.removeEventListener('resize', handleResize);
  clearInterval(intervalId);
});

watch(
  [props, currentTrackIndex, searchKeyword],
  () => {
    // TODO: 儲存音樂播放狀態，有需要時再開啟
    // loadTrack();
    checkLoginStatus();
  },
  { immediate: true, deep: true },
);
</script>

<template>
  <div
    class="header-container border-light-gray flex items-center justify-between border-b-2 pt-5 pb-[11px] md:pb-0"
  />
  <div
    class="cart-count blur-transition bg-secondary absolute top-[6px] right-3 flex h-[25px] w-[25px] items-center justify-center rounded-full text-xs font-bold text-white md:top-2 lg:top-[18px]"
    v-if="cartCount > 0"
  >
    <a href="/cart">{{ helpers.cartCountClass(cartCount) }}</a>
  </div>

  <div
    class="small-menu border-primary fixed top-19 left-0 hidden h-0 w-[120px] rounded border bg-white px-1 py-5 text-sm"
  >
    <div class="small-menu-option-container" />
  </div>

  <div
    class="member-menu border-primary fixed top-19 right-0 hidden h-0 w-[165px] rounded border bg-white p-2 md:top-17 md:w-[165px] lg:top-23 lg:w-[190px]"
  >
    <div class="member-menu-option-container">
      <div class="flex flex-col items-start justify-start">
        <div class="w-full px-1 py-2">
          <div
            v-for="(item, index) in memberCenterList"
            :key="index"
            class="flex items-center justify-between pt-3"
          >
            <p class="text-[18px] font-bold">{{ item.title }}</p>
            <ElInfoButton @click="item.action">
              <p class="text-[18px] font-bold">
                {{ item.dynamicText ? item.dynamicText() : '前往' }}
              </p>
            </ElInfoButton>
          </div>
          <div class="mt-[30px] flex flex-col items-center justify-center">
            <ElInfoButton
              :info-button-prop="loginButtonStatus"
              class="login-button w-full"
              @click="handleLoginButtonClick"
              ><p class="text-[18px] font-bold">{{ loginStatus }}</p>
            </ElInfoButton>
            <div class="w-full mt-2" :class="{ 'disable-execution': registerStatus === '已註冊會員' }">
              <ElInfoButton
                :info-button-prop="loginButtonStatus"
                class="login-button text-primary bg-light-brown mt-2 w-full border-2 border-gray-300"
                @click="helpers.forwardRoute('/register')"
                ><p class="text-[18px] font-bold">{{ registerStatus }}</p>
              </ElInfoButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div
    class="search-menu border-primary fixed top-19 left-0 hidden w-[300px] rounded border bg-white p-2 md:top-17 md:right-0 md:left-auto lg:top-23"
  >
    <div class="search-menu-option-container flex w-full items-center">
      <div class="flex h-[60px] items-center space-x-2">
        <input
          :value="searchKeyword"
          @input="onInputSanitize"
          @keyup.enter="handleSearchSubmit"
          class="h-full w-full grow rounded font-bold placeholder:text-[18px]"
          placeholder="請輸入關鍵字"
          type="text"
        />
        <div :class="{ 'pointer-events-none opacity-50': !searchKeyword }">
          <ElInfoButton
            class="text-card-description w-[100px] px-2 py-[14px] whitespace-nowrap"
            @click="helpers.forwardRoute(searchRoute)"
          >
            <p class="text-[18px] font-bold">{{ searchButtonName }}</p>
          </ElInfoButton>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.custom-scroll::-webkit-scrollbar {
  width: 12px;
  height: 0;
}

.custom-scroll::-webkit-scrollbar-track {
  background: #efe8e5;
  border-radius: 5px;
}

.custom-scroll::-webkit-scrollbar-thumb {
  background-color: #bbbbbb;
  border-radius: 5px;
  border: 3px solid #bbbbbb;
}

.custom-scroll::-webkit-scrollbar-thumb:hover {
  background-color: orange;
  border-color: orange;
  cursor: pointer;
}
</style>
