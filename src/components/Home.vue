<template>
  <section class="section home-section">
    <div class="container">
      <div class="columns">
        <div class="column has-text-centered">
          <b-message
            has-icon
            v-if="noMicrophoneAccess"
            :title="$t('no_microphone_access')"
            type="is-warning"
            aria-close-label="Close message"
          >
            {{ $t('text.no_microphone_access') }}
          </b-message>
          <div class="input-container">
            <div class="record-button-wrapper">
              <div class="record-button" @click="recordClip()">
                <img :src="publicPath + 'assets/microphone.svg'" width="50" />
                <span>{{ $t('button.record_clip') }}</span>
              </div>
            </div>
            <div class="or">
              {{ $t('or') }}
            </div>
            <b-field
              class="file-select-field file is-centered"
              position="is-centered"
            >
              <b-upload v-model="file" @input="fileInputSelected()" :disabled="isRecording">
                <a class="button is-primary is-outlined" @click="reset()" :disabled="isRecording">
                  <b-icon icon="paperclip"></b-icon>
                  <span>{{ $t('button.select_file') }}</span>
                </a>
              </b-upload>
              <span
                class="file-name"
                :class="{ 'has-text-danger': fileIsInvalid }"
                v-if="file"
              >
                {{ file.name }}
              </span>
              <b-tooltip
                class="file-tooltip"
                v-if="file && fileIsInvalid"
                type="is-danger"
                animater
                :label="$t('error.invalid_file_type')"
                position="is-right"
              >
                <b-icon type="is-danger" icon="alert-circle-outline"></b-icon>
              </b-tooltip>
            </b-field>
            <!-- <div class="file-url-field column is-4 is-offset-4 is-size-7">
              <a v-if="!showFileURLInput" @click="showFileURLInput = true">{{
                $t('button.insert_file_url')
              }}</a>
              <b-field
                v-if="showFileURLInput"
                :type="{ 'is-danger': fileIsInvalid }"
              >
                <b-input
                  :placeholder="$t('file_url')"
                  v-model="inputFileURL"
                  @input="fileUrlInput()"
                ></b-input>
              </b-field>
            </div> -->
            <div class="allowed-file-extensions has-text-grey-light is-size-7">
              {{ $t('allowed_file_extensions') }}:
              {{ allowedFileExtensionsString }}.
            </div>
            <div class="start-again" v-if="recording || file || isRecording">
              <b-button icon-left="restart" size="is-small" outlined @click="resetAll">
                {{ $t('button.reset_all') }}
              </b-button>
            </div>
          </div>

          <div>
            <div v-if="(recording || file || isRecording) && !fileIsInvalid">
              <hr />
              <h2 class="input-speech-title subtitle has-text-centered">
                {{ $t('input_speech') }}
              </h2>
            </div>
            <div v-if="isRecording || recording">
              <div v-if="isRecording" class="is-size-5">
                <span>🔴</span>
                <b-icon icon="microphone" class="vertical-icon"></b-icon
                >{{ formattedRecordingDuration }}
                <b-button outlined type="is-danger" @click="stopRecording()">
                  {{ $t('button.stop') }}
                </b-button>
              </div>
            </div>
            <div v-if="(recording || file || inputFileURL) && !fileIsInvalid">
              <b-button @click="togglePlay()">
                <b-icon v-if="!isPlaying" icon="play"></b-icon>
                <b-icon v-if="isPlaying" icon="pause"></b-icon>
              </b-button>
              <b-button
                @click="
                  wavesurfer.stop();
                  isPlaying = false;
                "
              >
                <b-icon icon="stop"></b-icon>
              </b-button>
              <b-button @click="wavesurfer.skipBackward()">
                <b-icon icon="rewind"></b-icon>
              </b-button>
              <b-button @click="wavesurfer.skipForward()">
                <b-icon icon="fast-forward"></b-icon>
              </b-button>
            </div>

            <!-- Waveform player -->
            <div class="waveform-player-container">
              <div
                v-show="(recording || file || inputFileURL) && !fileIsInvalid"
                class="is-size-5 player-current-time"
              >
                {{ wavesurferCurrentTime }}
              </div>
              <div id="waveform" v-show="(recording || file || inputFileURL | isRecording) && !fileIsInvalid"></div>
              <div
                v-show="(recording || file || inputFileURL) && !fileIsInvalid"
                class="is-size-5 player-duration"
              >
                {{ wavesurferDuration }}
              </div>
              <div v-show="recording">
                <a
                  :title="$t('button.download_recording')"
                  @click="downloadRecording()"
                >
                  <b-icon icon="download"></b-icon>
                </a>
              </div>
            </div>

            <b-switch
              v-if="identificationResultsPredictions.length"
              :value="showAttention"
              @input="toggleAttention()"
              >{{ $t('button.show_attention') }}</b-switch
            >
            <b-button
              type="is-primary"
              v-if="
                !identificationResultsPredictions.length &&
                  (file || recording) &&
                  !fileIsInvalid
              "
              @click="uploadFile()"
              >{{ $t('button.identify_language') }}</b-button
            >
          </div>
        </div>
      </div>

      <!-- Identification results -->
      <hr v-if="identificationResultsPredictions.length" />
      <div
        ref="identificationResults"
        v-if="identificationResultsPredictions.length"
      >
        <h2 class="subtitle has-text-centered">
          {{ $t('identification_results') }}
        </h2>
        <div class="columns">
          <div class="column is-4 is-offset-4 has-text-centered">
            <b-notification
              type="is-success"
              has-icon
              icon="check"
              :closable="false"
            >
              <div class="has-text-centered">
                <p class="is-size-5">
                  {{
                    getCorrectLanguageNameValue(
                      identificationResultsPredictions[0].language
                    )
                  }}
                </p>
                <p>
                  {{
                    formatPercentage(
                      identificationResultsPredictions[0].probability
                    )
                  }}%
                </p>
              </div>
            </b-notification>
          </div>
        </div>
        <div class="columns" v-if="identificationResultsPredictions.length">
          <div
            v-for="result in additionalIdentificationResults"
            :key="result.language.name"
            class="column has-text-centered"
          >
            <b-notification class="additional-result-box" :closable="false">
              <div class="has-text-centered">
                <p>{{ getCorrectLanguageNameValue(result.language) }}</p>
                <p>{{ formatPercentage(result.probability) }}%</p>
              </div>
            </b-notification>
          </div>
        </div>
      </div>
    </div>
    <b-loading
      :is-full-page="true"
      :active.sync="isLoadingResults"
      :can-cancel="false"
    >
      <b-icon icon="web" size="is-large" custom-class="fa-spin"> </b-icon>
    </b-loading>
  </section>
</template>

<script>
import axios from 'axios';
import WaveSurfer from 'wavesurfer.js';
import MicrophonePlugin from 'wavesurfer.js/dist/plugin/wavesurfer.microphone';
import RegionsPlugin from 'wavesurfer.js/dist/plugin/wavesurfer.regions';
import CursorPlugin from 'wavesurfer.js/dist/plugin/wavesurfer.cursor';

export default {
  name: 'Home',

  data() {
    return {
      publicPath: process.env.BASE_URL,
      file: null,
      recording: null,
      currentAudioURL: null,
      identificationResults: null,
      isRecording: false,
      mediaRecorder: null,
      recordingStartTime: null,
      recordingDuration: null,
      isLoadingResults: false,
      allowedFileExtensions: [],
      fileIsInvalid: false,
      showFileURLInput: false,
      inputFileURL: null,
      wavesurfer: null,
      isPlaying: false,
      wavesurferCurrentTime: '0:00',
      wavesurferDuration: '0:00',
      noMicrophoneAccess: false,
      showAttention: true,
      resetAllData: false
    };
  },

  created() {
    this.loadAllowedFileExtensions();
  },

  computed: {
    formattedRecordingDuration() {
      return this.recordingDuration
        ? this.recordingDuration
        : this.getRecordingDuration(0);
    },

    additionalIdentificationResults() {
      let modifiedResults = [...this.identificationResults.predictions];
      modifiedResults.shift();

      return modifiedResults;
    },

    allowedFileExtensionsString() {
      return this.allowedFileExtensions.join(', ');
    },

    identificationResultsPredictions() {
      if (this.identificationResults && this.identificationResults.predictions)
        return this.identificationResults.predictions;

      return [];
    }
  },

  methods: {
    uploadFile() {
      this.isLoadingResults = true;

      let uploadableFile;
      if (this.file) uploadableFile = this.file;
      if (this.recording) uploadableFile = this.recording;

      const fileName = uploadableFile.name
        ? uploadableFile.name
        : `rec_${Date.now()}.opus`;

      let formData = new FormData();
      formData.append('file', uploadableFile, fileName);

      axios
        .post(process.env.VUE_APP_API_URL + '/api/identify-language', formData)
        .then(response => {
          this.identificationResults = response.data;
          this.isLoadingResults = false;

          if (this.showAttention) {
            this.highlightAttention();
          }

          this.$nextTick().then(() => {
            this.$refs.identificationResults.scrollIntoView();
          });
        })
        .catch(error => {
          if (error.response.data.error.code === 'FILE_TOO_LARGE') {
            this.isLoadingResults = false;
            this.$buefy.toast.open({
              duration: 5000,
              message: this.$t('error.file_too_large'),
              position: 'is-bottom',
              type: 'is-danger'
            });
          }
        });
    },

    recordClip() {
      this.reset();

      if (!this.wavesurfer) {
        this.createWaveSurfer(true);
      } else {
        if (!this.wavesurfer.microphone) {
          this.wavesurfer.destroy();
          this.createWaveSurfer(true);
        }
      }

      this.wavesurfer.microphone.start();
    },

    stopRecording() {
      this.isRecording = false;
      this.mediaRecorder.stop();
      this.wavesurfer.microphone.stop();
    },

    formatPercentage(percentage) {
      return parseFloat(percentage * 100).toFixed(2);
    },

    formatTime(time) {
      return [
        Math.floor((time % 3600) / 60), // minutes
        ('00' + Math.floor(time % 60)).slice(-2) // seconds
      ].join(':');
    },

    getRecordingDuration(duration) {
      let milliseconds = parseInt((duration % 1000) / 100);
      let seconds = Math.floor((duration / 1000) % 60);
      let minutes = Math.floor((duration / (1000 * 60)) % 60);
      let hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

      hours = hours < 10 ? '0' + hours : hours;
      minutes = minutes < 10 ? '0' + minutes : minutes;
      seconds = seconds < 10 ? '0' + seconds : seconds;

      return hours + ':' + minutes + ':' + seconds + '.' + milliseconds;
    },

    reset() {
      if (this.wavesurfer) {
        this.wavesurfer.regions.clear();
      }
      this.recording = null;
      this.file = null;
      this.identificationResults = null;
    },

    fileInputSelected() {
      const fileExtension = this.file.name
        .split('.')
        .pop()
        .trim();
      if (!this.allowedFileExtensions.includes(fileExtension)) {
        this.fileIsInvalid = true;
        return;
      }

      if (!this.wavesurfer) this.createWaveSurfer();

      const audioUrl = URL.createObjectURL(this.file);

      this.wavesurfer.load(audioUrl);
      this.fileIsInvalid = false;
      this.currentAudioURL = audioUrl;
    },

    loadAllowedFileExtensions() {
      axios
        .get(process.env.VUE_APP_API_URL + '/api/allowed-files')
        .then(response => {
          this.allowedFileExtensions = response.data;
        });
    },

    fileUrlInput() {
      this.currentAudioURL = this.inputFileURL;
      this.file = null;
      const urlFileExtension = this.currentAudioURL.split('.').pop();
      if (!this.allowedFileExtensions.includes(urlFileExtension)) {
        this.fileIsInvalid = true;
      } else {
        this.fileIsInvalid = false;
        this.identificationResults = null;
        if (!this.wavesurfer) this.createWaveSurfer();
        this.wavesurfer.load(this.currentAudioURL);
        axios
          .get(this.currentAudioURL, { responseType: 'arraybuffer' })
          .then(response => {
            const fileName = this.currentAudioURL.substring(
              this.currentAudioURL.lastIndexOf('/') + 1
            );
            this.file = new File([response.data], fileName);
          });
      }
    },

    createWaveSurfer(microphone = false) {
      this.wavesurfer = WaveSurfer.create({
        container: '#waveform',
        responsive: true,
        hideScrollbar: true,
        height: 100,
        plugins: [
          CursorPlugin.create({
            showTime: true,
            opacity: 1,
            customShowTimeStyle: {
              'background-color': 'hsl(0, 0%, 96%)',
              'color': '#000',
              'padding': '3px',
              'font-size': '12px',
              'border-radius': '5px',
              'margin-left': '2px'
            }
          }),
          RegionsPlugin.create()
        ]
      });

      if (microphone) {
        this.wavesurfer
          .addPlugin(MicrophonePlugin.create())
          .initPlugin('microphone');

        this.wavesurfer.microphone.on(
          'deviceReady',
          this.processMicrophoneStream
        );

        this.wavesurfer.microphone.on('deviceError', () => {
          this.noMicrophoneAccess = true;
        });
      }

      this.wavesurfer.on('audioprocess', () => {
        this.wavesurferCurrentTime = this.formatTime(
          this.wavesurfer.getCurrentTime()
        );
      });

      this.wavesurfer.on('seek', () => {
        this.wavesurferCurrentTime = this.formatTime(
          this.wavesurfer.getCurrentTime()
        );
      });

      this.wavesurfer.on('ready', () => {
        this.wavesurferDuration = this.formatTime(
          this.wavesurfer.getDuration()
        );
      });

      this.wavesurfer.on('finish', () => {
        this.isPlaying = false;
      });
    },

    togglePlay() {
      if (this.isPlaying) {
        this.wavesurfer.pause();
        this.isPlaying = false;
      } else {
        this.wavesurfer.play();
        this.isPlaying = true;
      }
    },

    processMicrophoneStream(stream) {
      this.mediaRecorder = new MediaRecorder(stream);
      this.isRecording = true;
      this.recordingStartTime = Date.now();
      this.mediaRecorder.start();

      const timer = setInterval(() => {
        this.recordingDuration = this.getRecordingDuration(
          Math.abs(this.recordingStartTime - Date.now())
        );
      }, 100);

      const audioChunks = [];
      this.mediaRecorder.addEventListener('dataavailable', event => {
        audioChunks.push(event.data);
      });

      this.mediaRecorder.addEventListener('stop', () => {
        if (!this.resetAllData) {
          const audioBlob = new Blob(audioChunks);
          const audioUrl = URL.createObjectURL(audioBlob);
  
          this.currentAudioURL = audioUrl;
          this.recording = audioBlob;
          this.wavesurfer.load(audioUrl);
  
          clearInterval(timer);
        } else {
          this.resetAllData = false;  
        }
      });
    },

    downloadRecording() {
      const link = document.createElement('a');
      link.href = this.currentAudioURL;
      link.setAttribute('download', this.$t('recording_file_name') + '.opus');
      document.body.appendChild(link);
      link.click();
    },

    getCorrectLanguageNameValue(languageObject) {
      if (this.$i18n.locale === 'et' && languageObject.hasOwnProperty('etName')) {
        return languageObject.etName;
      }

      return languageObject.name;
    },

    toggleAttention() {
      if (this.showAttention) {
        this.showAttention = false;
        this.wavesurfer.regions.clear();
      } else {
        this.showAttention = true;
        this.highlightAttention();
      }
    },

    highlightAttention() {
      const attentionSegmentLength =
        this.wavesurfer.getDuration() /
        this.identificationResults.attention_total;

      this.identificationResults.attention_indices.forEach(indice => {
        this.wavesurfer.regions.add({
          start: indice * attentionSegmentLength,
          end: indice * attentionSegmentLength + attentionSegmentLength,
          drag: false,
          resize: false,
          color: 'hsla(204, 86%, 53%, 0.3)'
        });
      });
    },

    resetAll() {
      this.resetAllData = true;

      if (this.mediaRecorder && this.isRecording) {
        this.stopRecording();
      }
      
      this.wavesurfer.destroy();

      this.identificationResults = null;
      this.isRecording = false;
      this.recordingStartTime = null;
      this.recordingDuration = null;
      this.isLoadingResults = false;
      this.fileIsInvalid = false;
      this.showFileURLInput = false;
      this.inputFileURL = null;
      this.wavesurfer = null;
      this.isPlaying = false;
      this.wavesurferCurrentTime = '0:00';
      this.wavesurferDuration = '0:00';
      this.showAttention = true;
      this.mediaRecorder = null;
      this.file = null;
      this.recording = null;
      this.currentAudioURL = null;
    }
  }
};
</script>
<style scoped>
.home-section {
  padding-top: 10px;
}

.vertical-icon {
  vertical-align: middle;
}

.audio-player {
  margin-top: 15px;
  margin-bottom: 15px;
}

.additional-result-box {
  padding: 1.25rem 1.25rem 1.25rem 1.5rem;
}

.file-select-field {
  margin-bottom: 0px !important;
}

.file-url-field {
  padding-bottom: 0px !important;
}

.file-tooltip {
  display: flex;
  align-items: center;
}

.input-speech-title {
  margin-bottom: 10px;
}

.record-button {
  cursor: pointer;
  background-color: #3273dc;
  border-radius: 5px;
  color: white;
  font-size: 24px;
  display: flex;
  align-items: center;
  padding: 5px 15px 5px 5px;
}

.record-button:hover {
  background-color: #276cda;
}

.record-button:active {
  background-color: #2466d1;
}

.record-button-wrapper {
  display: flex;
  justify-content: center;
}

.input-container {
  margin-top: 35px;
}

.or {
  margin: 10px 0 10px 0;
}

/* 
  Waveform player
  ---------------
*/
#waveform {
  flex: 1;
  position: relative;
}

.waveform-player-container {
  display: flex;
  align-items: center;
  margin-top: 10px;
  margin-bottom: 10px;
}

.player-current-time {
  margin-right: 5px;
}

.player-duration {
  margin-left: 5px;
}

.start-again {
  margin-top: 10px;
}

.allowed-file-extensions {
  margin-top: 5px;
}
</style>