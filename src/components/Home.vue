<template>
  <section class="section home-section">
    <div class="container">
      <div class="columns">
        <div class="column has-text-centered">
          <h4 class="title is-4">{{ $t('language_identification') }}</h4>
          <div>
            <b-button
              type="is-primary"
              size="is-large"
              icon-left="microphone"
              @click="recordClip()"
            >
              {{ $t('button.record_clip') }}
            </b-button>
            <div>
              {{ $t('or') }}
            </div>
            <b-field
              class="file-select-field file is-centered"
              position="is-centered"
            >
              <b-upload v-model="file" @input="fileInputSelected()">
                <a class="button is-primary is-outlined" @click="reset()">
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
            <div class="file-url-field column is-4 is-offset-4 is-size-7">
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
            </div>
            <div class="has-text-grey-light is-size-7">
              {{ $t('allowed_file_extensions') }}:
              {{ allowedFileExtensionsString }}.
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
              <div class="is-size-5">
                <span v-if="isRecording">🔴</span>
                <b-icon icon="microphone" class="vertical-icon"></b-icon
                >{{ formattedRecordingDuration }}
                <b-button v-if="isRecording" @click="stopRecording()">
                  {{ $t('button.stop') }}
                </b-button>
              </div>
            </div>
            <div v-if="(recording || file || inputFileURL) && !fileIsInvalid">
              <b-button rounded @click="togglePlay()">
                <b-icon v-if="!isPlaying" icon="play"></b-icon>
                <b-icon v-if="isPlaying" icon="pause"></b-icon>
              </b-button>
              <b-button
                rounded
                @click="
                  wavesurfer.stop();
                  isPlaying = false;
                "
              >
                <b-icon icon="stop"></b-icon>
              </b-button>
              <b-button rounded @click="wavesurfer.skipBackward()">
                <b-icon icon="rewind"></b-icon>
              </b-button>
              <b-button rounded @click="wavesurfer.skipForward()">
                <b-icon icon="fast-forward"></b-icon>
              </b-button>
            </div>
            <div class="waveform-player-container">
              <div
                v-show="(recording || file || inputFileURL) && !fileIsInvalid"
                class="is-size-5 player-current-time"
              >
                {{ wavesurferCurrentTime }}
              </div>
              <div id="waveform"></div>
              <div
                v-show="(recording || file || inputFileURL) && !fileIsInvalid"
                class="is-size-5 player-duration"
              >
                {{ wavesurferDuration }}
              </div>
            </div>
            <b-button
              type="is-primary"
              v-if="
                !identificationResults.length &&
                  (file || recording) &&
                  !fileIsInvalid
              "
              @click="uploadFile()"
              >{{ $t('button.identify_language') }}</b-button
            >
          </div>
        </div>
      </div>
      <hr v-if="identificationResults.length" />
      <div ref="identificationResults" v-if="identificationResults.length">
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
                  {{ identificationResults[0].language.name }}
                </p>
                <p>
                  {{ formatPercentage(identificationResults[0].probability) }}%
                </p>
              </div>
            </b-notification>
          </div>
        </div>
        <div class="columns" v-if="identificationResults.length">
          <div
            v-for="result in additionalIdentificationResults"
            :key="result.language.name"
            class="column has-text-centered"
          >
            <b-notification class="additional-result-box" :closable="false">
              <div class="has-text-centered">
                <p>{{ result.language.name }}</p>
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

export default {
  name: 'Home',

  data() {
    return {
      file: null,
      recording: null,
      currentAudioURL: null,
      identificationResults: [],
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
      wavesurferDuration: '0:00'
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
      let modifiedResults = [...this.identificationResults];
      modifiedResults.shift();

      return modifiedResults;
    },

    allowedFileExtensionsString() {
      return this.allowedFileExtensions.join(', ');
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

          this.$nextTick().then(() => {
            this.$refs.identificationResults.scrollIntoView();
          });
        })
        .catch(error => {
          // TODO: handle error
          console.log('error', error);
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
      this.wavesurfer.microphone.on('deviceReady', this.processMicrophoneStream);
    },

    stopRecording() {
      this.isRecording = false;
      this.mediaRecorder.stop();
      this.wavesurfer.microphone.stop();
      // Remove event, otherwise these events keep collecting and firing
      this.wavesurfer.microphone.un('deviceReady', this.processMicrophoneStream);
    },

    tryAgain() {
      location.reload();
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
      this.recording = null;
      this.file = null;
      this.identificationResults = [];
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
        this.identificationResults = [];
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
        hideScrollbar: true
      });

      if (microphone)
        this.wavesurfer
          .addPlugin(MicrophonePlugin.create())
          .initPlugin('microphone');

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
        const audioBlob = new Blob(audioChunks);
        const audioUrl = URL.createObjectURL(audioBlob);

        this.currentAudioURL = audioUrl;
        this.recording = audioBlob;
        this.wavesurfer.load(audioUrl);

        clearInterval(timer);
      });
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

/* 
  Waveform player
  ---------------
*/
#waveform {
  flex: 1;
}

.waveform-player-container {
  display: flex;
  align-items: center;
}

.player-current-time {
  margin-right: 5px;
}

.player-duration {
  margin-left: 5px;
}
</style>