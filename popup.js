console.log("lol")
chrome.browserAction.setBadgeText({text:""},function(callback){})
chrome.runtime.sendMessage({data:"Handshake"},function(response){
  console.log("sent");
});
chrome.runtime.onMessage.addListener(function(message,sender,sendResponse){
  console.log("new msg",message);
	str = JSON.stringify(message.data);
});

function prettify(unit){
  if (unit < 10) {
    return "0"+unit
  }
  return ""+unit
}

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

Vue.component('report',{
  template: '<div><a v-on:click.once="download">Download report</a></div>',
  methods: {
    download(event,data){
      console.log("event",event);
      console.log("data",data);
      target = event.target
      chrome.storage.sync.get("history",function(data){
        target.href = "data:application/json;charset=utf-8,"+encodeURIComponent(JSON.stringify(data.history))
        target.download = "tracker-report.json"
        target.click()
      })
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
  template: '<div><div class="welcome-message" v-if="!clock.hour"><div>Click on a task</div></div><div class="clock" v-if="clock.hour"><div v-on:click="stopClock"><img src="stop-48.png"></div><div><span>{{clock.hour}}</span>:<span>{{clock.minute}}</span>:<span>{{clock.second}}</span></div></div></div>',
  compute: {

  },
  methods: {
    calculateUnit(a,b){
      var n = a / b
      var m = a % b
      return {div:parseInt(n), mod:m}
    },
    getClock(){
      var hour,minute,second
      var hourData = this.calculateUnit(this.elapsedTime,3600000)
      var minuteData = this.calculateUnit(hourData.mod,60000)
      var secondData = this.calculateUnit(minuteData.mod,1000)
      return {hour: prettify(hourData.div), minute: prettify(minuteData.div), second: prettify(secondData.div)}
    },
    stopClock() {
      this.$emit("stop-clock")
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
    endCurrentTask(callback) {
      var that = this
      var task = {name: this.selectTask, startTime: this.startTime}
      var date = new Date(task.startTime)
      var dateFormat = date.getFullYear()+"/"+prettify(date.getMonth()+1)+"/"+prettify(date.getDate())
      callback = callback ? callback : function(){}
      chrome.storage.sync.get('history', function(data) {
        var history = data.history ? data.history : {}
        var dateContent = history[dateFormat] ? history[dateFormat] : {}
        var taskCount = dateContent[task.name] ? dateContent[task.name] : 0
        dateContent[task.name] = taskCount + that.getElapsedTime() / 1000
        history[dateFormat] = dateContent
        chrome.storage.sync.set({history:history},function(data){
          chrome.storage.sync.set({task: {}},function(data){
            that.selectedTask = ''
            that.startTime = 0
            console.log("clock icon");
            callback()
          })
        })
      });
    },
    getElapsedTime(){
      if (this.startTime) {
        return Date.now() - this.startTime
      }
      return 0
    },
    selectTask(task) {
      var that = this
      if (task == this.selectTask){
        return
      }
      this.endCurrentTask(function(){
        that.startTask(task)
      })
    },
    setElapsedTime() {
      this.elapsedTime = this.getElapsedTime()
    },
    setTaskFromStorage() {
      var that = this
      chrome.storage.sync.get('task', function(data) {
        var task = data.task
        if (task) {
          that.selectedTask= data.task.name
          that.startTime = data.task.startTime
        }
      });
    },
    startTask(task) {
      var startTime = Date.now()
      this.selectedTask = task
      this.startTime = startTime
      chrome.storage.sync.set({task:{name: task, startTime: startTime}}, function(data) {

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
    this.updateElapsedTime();
    chrome.storage.onChanged.addListener(function(changes, namespace) {
      var task = changes.task
      if (task) {
        if (task.newValue.name) {
          console.log("task icon");
          chrome.browserAction.setIcon({path: task.newValue.name+"-48.png"})
        } else {
          console.log("clock icon");
          chrome.browserAction.setIcon({path: "clock-48.png"})
        }
      }
    });
    console.log("yoh");
  }
})
