<template>
    <v-fab :key="fabPosition" :absolute="fabPosition === 'absolute'" :app="fabPosition === 'fixed'"
        :color="open ? '' : 'primary'" :location="fabLocation" size="large" icon class="fab-fixed-bottom-left">
        <v-icon>{{ open ? 'mdi-close' : 'mdi-menu' }}</v-icon>
        <v-speed-dial v-model="open" :location="menuLocation" :transition="transition" activator="parent">
            <v-tooltip text="會員儲值" location="right">
                <template v-slot:activator="{ props }">
                    <v-btn 
                        key="1" 
                        color="primary" 
                        icon
                        v-bind="props"
                        @click="navigateTo('/main/Wallet/Recharge')"
                    >
                        <v-icon size="24">mdi-wallet-plus</v-icon>
                    </v-btn>
                </template>
            </v-tooltip>

            <v-tooltip text="訂單扣款" location="right">
                <template v-slot:activator="{ props }">
                    <v-btn 
                        key="2" 
                        color="error" 
                        icon
                        v-bind="props"
                        @click="navigateTo('/main/Wallet/Deduction')"
                    >
                        <v-icon size="24">mdi-cash-minus</v-icon>
                    </v-btn>
                </template>
            </v-tooltip>

            <v-tooltip text="交易記錄" location="right">
                <template v-slot:activator="{ props }">
                    <v-btn 
                        key="3" 
                        color="success" 
                        icon
                        v-bind="props"
                        @click="navigateTo('/main/Wallet/TransactionHistory')"
                    >
                        <v-icon size="24">mdi-history</v-icon>
                    </v-btn>
                </template>
            </v-tooltip>

            <v-tooltip text="餘額查詢" location="right">
                <template v-slot:activator="{ props }">
                    <v-btn 
                        key="4" 
                        color="warning" 
                        icon
                        v-bind="props"
                        @click="navigateTo('/main/Wallet/BalanceQuery')"
                    >
                        <v-icon size="24">mdi-account-cash</v-icon>
                    </v-btn>
                </template>
            </v-tooltip>

            <v-tooltip text="訂單查詢" location="right">
                <template v-slot:activator="{ props }">
                    <v-btn 
                        key="5" 
                        color="info" 
                        icon
                        v-bind="props"
                        @click="navigateTo('/main/Wallet/OrderQuery')"
                    >
                        <v-icon size="24">mdi-file-search</v-icon>
                    </v-btn>
                </template>
            </v-tooltip>
        </v-speed-dial>
    </v-fab>
</template>


<script setup>
import { shallowRef, watch } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const open = shallowRef(false)
const fabPosition = shallowRef('fixed')
const menuLocation = shallowRef('top center')
const fabLocation = shallowRef('left bottom')
const transition = shallowRef('slide-y-reverse-transition')

watch(menuLocation, reopen)
watch(transition, reopen)
watch(fabLocation, () => open.value = false)
watch(fabPosition, () => open.value = false)

function reopen() {
    open.value = false
    setTimeout(() => open.value = true, 400)
}

function navigateTo(route) {
    open.value = false
    router.push(route)
}
</script>
<style scoped>
/* This is for documentation purposes and will not be needed in your application */
::v-deep(.v-application__wrap) {
    min-height: 0 !important;
}

/* 固定 FAB 在左下角，距離左邊和底部各 60px */
::v-deep(.fab-fixed-bottom-left) {
    left: 60px !important;
    bottom: 60px !important;
    right: auto !important;
    top: auto !important;
}

/* 針對不同可能的類名選擇器 */
::v-deep(.fab-fixed-bottom-left.v-fab) {
    left: 60px !important;
    bottom: 60px !important;
}

::v-deep(.fab-fixed-bottom-left.v-btn) {
    left: 60px !important;
    bottom: 60px !important;
}

.v-selection-control--disabled,
.v-input--disabled .v-selection-control {
    opacity: .1;
}

.v-radio {
    flex-grow: 0 !important;
}

h5 {
    margin-bottom: 12px;
}

code {
    display: block;
    font-size: .8rem;
    margin-top: 12px;
}

::v-deep(.v-label) {
    margin-left: 8px;
}
</style>