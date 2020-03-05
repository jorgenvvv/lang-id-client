<template>
  <section class="section home-section">
    <div class="container">
      <div class="columns">
        <div class="column has-text-centered">
          <h4 class="title is-4">Language Identification</h4>
          <div v-if="!isRecording && !hasRecording">
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
            <b-field class="file is-centered" position="is-centered">
              <b-upload v-model="file" @input="fileInputSelected()">
                <a class="button is-primary is-outlined">
                  <b-icon icon="paperclip"></b-icon>
                  <span>Select a file</span>
                </a>
              </b-upload>
              <span class="file-name" v-if="file">
                {{ file.name }}
              </span>
            </b-field>
          </div>
          <div>
            <div v-if="(isRecording || hasRecording) && !inputFromFile">
              <div class="is-size-5">
                <span v-if="isRecording">🔴</span>
                <b-icon icon="microphone" class="vertical-icon"></b-icon
                >{{ formattedRecordingDuration }}
                <b-button v-if="isRecording" @click="stopRecording()">
                  Stop
                </b-button>
              </div>
            </div>
            <div class="recording-player" v-if="hasRecording">
              <audio
                id="player"
                controls
                controlsList="nodownload"
                :src="recordedAudioURL"
              ></audio>
            </div>
            <b-button
              type="is-primary"
              v-if="!identificationResults.length && hasRecording"
              @click="uploadFile()"
              >Identify Language</b-button
            >
            <b-button
              type="is-primary"
              size="is-large"
              v-if="identificationResults.length"
              @click="tryAgain()"
              >Try Again</b-button
            >
          </div>
        </div>
      </div>
      <hr v-if="identificationResults.length" />
      <div v-if="identificationResults.length">
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
      identificationResults: [],
      recordedAudioURL: null,
      isRecording: false,
      hasRecording: false,
      mediaRecorder: null,
      recordingStartTime: null,
      recordingDuration: null,
      isLoadingResults: false,
      inputFromFile: false
    };
  },

  computed: {
    formattedRecordingDuration() {
      return this.recordingDuration ? this.recordingDuration : this.getRecordingDuration(0);
    },

    downloadLinkURL() {
      return this.hasRecording ? this.recordedAudioURL : null;
    },

    additionalIdentificationResults() {
      let modifiedResults = [...this.identificationResults];
      modifiedResults.shift();

      return modifiedResults;
    }
  },

  methods: {
    uploadFile() {
      this.isLoadingResults = true;

      const fileName = this.file.name ? this.file.name : `rec_${Date.now()}.opus`;

      let formData = new FormData();
      formData.append('file', this.file, fileName);

      axios
        .post(process.env.VUE_APP_API_URL + '/api/identify-language', formData)
        .then(response => {
          this.identificationResults = response.data;
          this.isLoadingResults = false;
        })
        .catch(error => {
          // TODO: handle error
          console.log('error', error);
        });
    },

      recordClip() {
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
  
            this.recordedAudioURL = audioUrl;
            this.file = audioBlob;
            this.hasRecording = true;
  
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

    fileInputSelected() {
      this.inputFromFile = true;
      const audioUrl = URL.createObjectURL(this.file);

      this.recordedAudioURL = audioUrl;
      this.hasRecording = true;
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

.recording-player {
  margin-top: 15px;
  margin-bottom: 15px;
}

.additional-result-box {
  padding: 1.25rem 1.25rem 1.25rem 1.5rem;
}
</style>