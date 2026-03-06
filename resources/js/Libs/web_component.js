import { defineCustomElement } from 'vue';
import ElEpubReader from '@/Components/ElEpubReader.ce.vue';
import ElEpubCheckList from '@/Components/ElEpubCheckList.ce.vue';
import componentStyles from '@/../scss/main.scss?inline';
import tailwindCSS from '@/../css/tailwind.css?inline';
import elementPlusCSS from 'element-plus/dist/index.css?inline';

const elementPlusStyles = elementPlusCSS.replace(/:root/g, ':host');

const EpubReaderElement = defineCustomElement({
  ...ElEpubReader,
  shadow: { mode: 'closed' },
  styles: [tailwindCSS, componentStyles, elementPlusStyles],
  connectedCallback() {
    if (ElEpubReader.connectedCallback) {
      ElEpubReader.connectedCallback.call(this);
    }
  },
});

customElements.define('epub-reader', EpubReaderElement);

const EpubCheckListElement = defineCustomElement({
  ...ElEpubCheckList,
  shadow: { mode: 'closed' },
  styles: [tailwindCSS, componentStyles, elementPlusStyles],
  connectedCallback() {
    if (ElEpubCheckList.connectedCallback) {
      ElEpubCheckList.connectedCallback.call(this);
    }
  },
});

customElements.define('epub-check-list', EpubCheckListElement);
