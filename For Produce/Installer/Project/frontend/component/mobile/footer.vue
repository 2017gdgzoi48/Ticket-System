<script>
export default {
	props:['pageIdx']
};
</script>

<template>
	<van-tabbar v-model="pageIdx" active-color="#4b78fe">
		<van-tabbar-item>
			活动购票
			<template #icon="{active}">
				<van-icon :name="'shopping-cart'+(!active?'-o':'')"/>
			</template>
		</van-tabbar-item>
		<van-tabbar-item>
			我的订单
			<template #icon="{active}">
				<van-icon :name="'coupon'+(!active?'-o':'')"/>
			</template>
		</van-tabbar-item>
		<van-tabbar-item>
			个人信息
			<template #icon="{active}">
				<van-icon :name="'friends'+(!active?'-o':'')"/>
			</template>
		</van-tabbar-item>
		<van-tabbar-item>
			关于我们
			<template #icon="{active}">
				<van-icon :name="'comment'+(!active?'-o':'')"/>
			</template>
		</van-tabbar-item>
	</van-tabbar>
</template>

