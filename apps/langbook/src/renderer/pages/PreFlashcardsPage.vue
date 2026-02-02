<script lang="ts" setup>
  import Header from '@renderer/components/Header.vue';
</script>

<template>
  <div class="settings-page">
    <Header />
    <div class="content">
      <h1>Flashcards study</h1>

      <section>
        <h2>Overall statistics</h2>
        <div class="flex justify-between">
          <span>Total number of cards</span>
          <b>0</b>
        </div>
        <div class="flex justify-between">
          <span>Total number of cards in the review bucket</span>
          <b>0</b>
        </div>
        <div class="flex justify-between">
          <span>Total number of low frequency cards</span>
          <b>0</b>
        </div>
        <div class="flex justify-between">
          <span>Total number of high frequency cards</span>
          <b>0</b>
        </div>
        <div class="flex justify-between">
          <span>Total number of normal frequency cards</span>
          <b>0</b>
        </div>
      </section>

      <section>
        <h2>Selected cards</h2>
        <div class="flex justify-between">
          <span>Selected cards</span>
          <b>0</b>
        </div>
        <div class="flex justify-between">
          <span>Selected cards in the review bucket</span>
          <b>0</b>
        </div>
        <div class="flex justify-between">
          <span>Selected cards with low frequency</span>
          <b>0</b>
        </div>
        <div class="flex justify-between">
          <span>Selected cards with high frequency</span>
          <b>0</b>
        </div>
        <div class="flex justify-between">
          <span>Selected cards with normal frequency</span>
          <b>0</b>
        </div>
      </section>

      <section>
        <h2>Options</h2>
        <div class="flex justify-between">
          <span>High frequency interval</span>
          <input type="number" />
        </div>
        <div class="flex justify-between">
          <span>Low frequency interval</span>
          <input type="number" />
        </div>
        <div class="flex">
          <button type="button" class="ml-auto btn-primary">Reset</button>
        </div>
      </section>

      <section>
        <h2>Review bucket</h2>
        <div class="flex justify-between">
          <span>Clear review bucket for selected cards</span>
          <button type="button" class="btn-warning">Clear</button>
        </div>
      </section>

      <div>
        <button type="button" class="btn btn-primary">Start</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
  input {
    max-width: 80px;
    text-align: center;
  }
</style>
