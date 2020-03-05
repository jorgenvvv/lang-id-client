<template>
  <section class="section home-section">
    <div class="container">
      <div class="columns">
        <div class="column has-text-centered">
          <h4 class="title is-4">Language Identification</h4>
          <div>
            <b-button
              type="is-primary"
              size="is-large"
              icon-left="microphone"
              @click="recordClip()"
            >
              Record a clip
            </b-button>
            <div>
              or
            </div>
            <b-field class="file-select-field file is-centered" position="is-centered">
              <b-upload v-model="file" @input="fileInputSelected()">
                <a class="button is-primary is-outlined" @click="reset()">
                  <b-icon icon="paperclip"></b-icon>
                  <span>Select a file</span>
                </a>
              </b-upload>
              <span class="file-name" :class="{'has-text-danger': fileIsInvalid}" v-if="file">
                {{ file.name }}
              </span>
              <b-tooltip class="file-tooltip" v-if="fileIsInvalid" type="is-danger" animater label="Invalid file type" position="is-right">
                <b-icon type="is-danger" icon="alert-circle-outline"></b-icon>
              </b-tooltip>
            </b-field>
            <span class="has-text-grey-light is-size-7">Allowed file extensions: {{ allowedFileExtensionsString }}.</span>
          </div>
          <div>
            <div v-if="recording || file || isRecording">
              <hr>
              <h2 class="subtitle has-text-centered">Input Speech</h2>
            </div>
            <div v-if="isRecording || recording">
              <div class="is-size-5">
                <span v-if="isRecording">🔴</span>
                <b-icon icon="microphone" class="vertical-icon"></b-icon
                >{{ formattedRecordingDuration }}
                <b-button v-if="isRecording" @click="stopRecording()">
                  Stop
                </b-button>
              </div>
            </div>
            <div class="audio-player" v-if="(recording || file) && !fileIsInvalid">
              <audio
                id="player"
                controls
                controlsList="nodownload"
                :src="currentAudioURL"
              ></audio>
            </div>
            <b-button
              type="is-primary"
              v-if="!identificationResults.length && (file || recording) && !fileIsInvalid"
              @click="uploadFile()"
              >Identify Language</b-button
            >
          </div>
        </div>
      </div>
      <hr v-if="identificationResults.length" />
      <div ref="identificationResults" v-if="identificationResults.length">
        <h2 class="subtitle has-text-centered">Identification Results</h2>
        <div class="columns">
          <div class="column is-4 is-offset-4 has-text-centered">
            <b-notification
              type="is-success"
              has-icon
              icon="check"
              :closable="false"
            >
              <div class="has-text-centered">
                <p class="is-size-5">{{ identificationResults[0].language.name }}</p>
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

export default {
  name: 'Home',

  data() {
    return {
      file: null,
      recording: null,
      identificationResults: [],
      isRecording: false,
      mediaRecorder: null,
      recordingStartTime: null,
      recordingDuration: null,
      isLoadingResults: false,
      allowedFileExtensions: [],
      fileIsInvalid: false
    };
  },

  created() {
    this.loadAllowedFileExtensions();
  },

  computed: {
    formattedRecordingDuration() {
      return this.recordingDuration ? this.recordingDuration : this.getRecordingDuration(0);
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

      const fileName = uploadableFile.name ? uploadableFile.name : `rec_${Date.now()}.opus`;

      let formData = new FormData();
      formData.append('file', uploadableFile, fileName);

      axios
        .post(process.env.VUE_APP_API_URL + '/api/identify-language', formData)
        .then(response => {
          this.identificationResults = response.data;
          this.isLoadingResults = false;

          this.$nextTick()
          .then(() => {
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
        navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
          this.mediaRecorder = new MediaRecorder(stream);
          this.mediaRecorder.start();
          this.isRecording = true;
          this.recordingStartTime = Date.now();
  
          let timer = setInterval(() => {
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
  
            clearInterval(timer);
          });
        });
      },

    stopRecording() {
      this.isRecording = false;
      this.mediaRecorder.stop();
    },

    tryAgain() {
      location.reload();
    },

    formatPercentage(percentage) {
      return parseFloat(percentage * 100).toFixed(2);
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
      const fileExtension = this.file.name.split('.').pop().trim();
      if (!this.allowedFileExtensions.includes(fileExtension)) {
        this.fileIsInvalid = true;
        return
      }

      const audioUrl = URL.createObjectURL(this.file);

      this.fileIsInvalid = false;
      this.currentAudioURL = audioUrl;
    },

    loadAllowedFileExtensions() {
      axios.get(process.env.VUE_APP_API_URL + '/api/allowed-files')
      .then(response => {
        this.allowedFileExtensions = response.data;
      })
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

.file-tooltip {
  display: flex;
  align-items: center;
}
</style>