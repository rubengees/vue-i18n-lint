<template>
  <div class="card">
    <div v-if="loading" class="spinner"></div>
    <div v-else>
      <ul>
        <li v-for="item in items" :key="item.id" :class="{ active: item.id === selected }">
          <span>{{ item.name }}</span>
          <span class="badge">{{ item.count }}</span>
        </li>
      </ul>
      <button :disabled="!canSubmit" @click="submit">Submit</button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  items: { id: number; name: string; count: number }[]
  loading: boolean
  selected: number | null
}>()

const emit = defineEmits<{ submit: [] }>()

const canSubmit = true

function submit() {
  emit("submit")
}
</script>
