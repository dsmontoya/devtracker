console.log("lol")
chrome.browserAction.setBadgeText({text:""},function(callback){})
chrome.runtime.sendMessage({data:"Handshake"},function(response){
  console.log("sent");
});
chrome.runtime.onMessage.addListener(function(message,sender,sendResponse){
  console.log("new msg",message);
	str = JSON.stringify(message.data);
});

Vue.component('tasks', {
  props: ['name','selected-task'],
  template: '<div class="tasks"><task v-for="task in tasks" v-bind:selected-task="selectedTask" @select-task="selectTask" v-bind:key="task.name" :icon="task.icon" :title="task.title" :name="task.name"></task></div>',
  data: function(){
    return {
      tasks: [
        {name: "bug", icon: "bug-48.png", title:"Debugging"},
        {name: "code", icon: "code-48.png",title:"Coding"},
        {name: "break", icon: "break-48.png",title:"Taking a break"},
        {name: "research", icon: "research-48.png", title:"Researching"},
        {name: "devops", icon: "devops-48.png", title:"Devops"},
        {name: "tests", icon: "tests-48.png", title:"Testing"},
        {name: "planning", icon: "planning-48.png",title: "Planning"},
        {name: "support", icon: "support-48.png",title: "Support"}
      ]
    }
  },
  methods: {
    selectTask(value) {
      console.log("hey 2",value,value);
      this.$emit('select-task',value)
    }
  }
})

Vue.component('task', {
  props: ['icon','title','name','selected-task'],
  template: '<div class="task" v-bind:class="{selected: selectedTask===name}" v-on:click="selectTask(name)"><img v-bind:src="icon">{{title}}</div>',
  data: function(){
    return {
      tasks: [
        {name: "bug", icon: "bug-48.png"}
      ]
    }
  },
  methods: {
    selectTask(task) {
      console.log("hey",task);
      this.$emit('select-task',task)
    }
  }
})

Vue.component('stop-watch', {
  props:['elapsedTime'],
  data: function(){
    return {
      clock: {}
    }
  },
  template: '<div class="clock" v-if="clock.hour"><span>{{clock.hour}}</span>:<span>{{clock.minute}}</span>:<span>{{clock.second}}</span></div>',
  compute: {

  },
  methods: {
    calculateUnit(a,b){
      console.log("a",a,"b",b);
      var n = a / b
      var m = a % b
      return {div:parseInt(n), mod:m}
    },
    getClock(){
      var hour,minute,second
      var hourData = this.calculateUnit(this.elapsedTime,3600000)
      var minuteData = this.calculateUnit(hourData.mod,60000)
      var secondData = this.calculateUnit(minuteData.mod,1000)
      return {hour: this.prettify(hourData.div), minute: this.prettify(minuteData.div), second: this.prettify(secondData.div)}
    },
    prettify(unit){
      if (unit < 10) {
        return "0"+unit
      }
      return ""+unit
    }
  },
  watch: {
    elapsedTime: function(nw,old) {
      this.clock = this.getClock()
    }
  }
})

var app = new Vue({
  el: '#app',
  data: {
    message: 'Hello Vue!',
    selectedTask: 'bffug',
    startTime: 0,
    elapsedTime: 0,
  },
  methods: {
    getElapsedTime(){
      return Date.now() - this.startTime
    },
    selectTask(task) {
      if (task == this.selectTask){
        return
      }
      var startTime = Date.now()
      console.log("select task",task);
      this.selectedTask = task
      this.startTime = startTime
      chrome.storage.sync.set({task:task}, function(data) {

      });
      chrome.storage.sync.set({time:startTime}, function(data) {

      });
      chrome.browserAction.setIcon({path: task+"-48.png"})
    },
    setElapsedTime() {
      this.elapsedTime = this.getElapsedTime()
    },
    setTaskFromStorage() {
      var that = this
      chrome.storage.sync.get('task', function(data) {
        if (data.task) {
          that.selectedTask= data.task
        }
      });
    },
    setStartTimeFromStorage() {
      var that = this
      chrome.storage.sync.get('time', function(data) {
        if (data.time) {
          that.startTime = data.time
        }
      });
    },
    updateElapsedTime(){
      var that = this
      setInterval(function () {
        that.setElapsedTime();
      }, 1000);
    }
  },
  beforeMount(){
    this.setTaskFromStorage()
    this.setStartTimeFromStorage()
    this.updateElapsedTime();
    console.log("yoh");
  }
})
