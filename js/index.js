(function () {
	var $btnAdd = $('#add');
	//var $delete = $('.delete');由于delete是动态生成的，所以不能直接获取
	var $delete, $detail, $checkbox, $dateTime;
	var currentIndex;
	var $detailShow = $('.detail-show');
	var $mask = $('.mask');
	var $msg = $('.msg');
	var $msgP = $('.msg>p');
	var $alert = $('.alert');
	var $msgClick = $('.msg>button');
	var taskList = [];//data数据

	init();//初始化

	$btnAdd.submit(function(ev) {
		var newTask = {};
		var $input = $(this).find('input[name=content]');
		ev.preventDefault();//禁止表单提交完自动刷新页面
		newTask.content = $input.val();//{'content' : '值''}
		if (!newTask.content) return;
		addTask(newTask);//将新建的task存入store
		$input.val('');
	});

	$btnAdd.keyup(function(ev) {//给回车绑定submit事件
		ev.preventDefault();
		if (ev.which == 13) {//回车键
			$btnAdd.submit();//执行submit事件
		}
	});

	$msgClick.click(function() {
		hideMsg();
	});

	function lisitenDelete () {//监听删除事件【不能直接执行删除事件，因为这是动态生成的】
		$delete.click(function(ev) {
			ev.stopPropagation();
			var thisLi = $(this).parents('.task-li');
			var index = thisLi.data('index');
			/* var sure = confirm('确认删除吗？');
			 sure ? deleteTask(index) : null;*/
			 
//利用SweetAlert.js模拟确认弹框
			swal({ 
			  title: "确定删除吗？",  
			  type: "warning",
			  showCancelButton: true, 
			  confirmButtonColor: "#DD6B55",
			  confirmButtonText: "确定删除！",
			  allowOutsideClick: true, 
			  cancelButtonText: "取消",
			  closeOnConfirm: false
			},
			function(){
			  swal("删除成功！", "已成功删除这条记录。", "success"); 
			  deleteTask(index);
			});

		});
	}

	function lisitenDetail () {
		var index;
		//详情被点击时
		$detail.click(function() {
			var thisLi = $(this).parents('.task-li');
			index = thisLi.data('index');
			showDetail(index);
		});
		//整条task-li被点击时
		$('.task-li').click(function() {
			index = $(this).data('index');
			showDetail(index);
		});
	}

	function listenCheckbox () {
		$checkbox.click(function(ev) {
			ev.stopPropagation();//阻止冒泡误触task-li的click事件
			var index = $(this).parent().data('index');
			var data = getDataFromStore(index);
			if (data.done) {
				updateTask(index, {done : false});
			} else {
				updateTask(index, {done : true});
			}
		});
	}

	$mask.click(function() {
		hideDetail();
	});

	function updateTask (index,newData) {
		if(!taskList[index]) return;
		taskList[index] = $.extend({}, taskList[index], newData);//extend() 函数作用于object，此处是将原本的数据taskList[index]和新数据newData合并到{}。merge() 函数用于合并两个数组内容到第一个数组。
		refreshStore();
	}

	function getDataFromStore (index) {
		return store.get('taskList')[index];
	}
	function showDetail (index) {
		renderDetail(index);
		currentIndex = index;
		$mask.show();
		$detailShow.show();
	}

	function hideDetail (index) {
		$mask.hide();
		$detailShow.hide();
	}

	function renderDetail (index) {
		var template = `<form id="update-form">
		<div class="detail-content" contenteditable="true">${taskList[index].content}</div>
		<textarea>${taskList[index].desc || '添加详细内容'}</textarea><br>
		<input placeholder="请设置提醒时间" class="datetime" type="text" value="${taskList[index].date || ''}"><br>
		<button class="btn-update" type="submit">更新</button>
		</form>
		`;
		$detailShow.html('');
		$detailShow.html(template);
		$updateForm = $detailShow.find('#update-form');
		$updateForm.submit(function(ev) {
			ev.preventDefault();
			taskList[index].content = $(this).find('.detail-content').html();
			taskList[index].desc = $(this).find('textarea').val();
			taskList[index].date = $(this).find('.datetime').val();
			updateTask(index, taskList[index]);
			hideDetail();
		});


		$dateTime = $('.datetime');//动态获取
		$.datetimepicker.setLocale('zh');//设置成简体中文
		$dateTime.datetimepicker();//启动datetimepicker
	}

	function addTask (newTask) {
		taskList.unshift(newTask);
		refreshStore();
	}

	function refreshStore () {//刷新store之后，重新渲染task-list
		store.set('taskList',taskList);
		renderTaskList();
	}

	function init () {//初始化
		taskList = store.get('taskList') || [];//刚开始localStorage里没有数据，默认为空数组
		if(taskList.length) {
			renderTaskList();
		}
		taskRemindCheck();
		console.log(taskList)
	}

	function renderTaskList () {
		var $taskListUl = $('.task-list');
		var doneTask = [];
		$taskListUl.html('');
		for (var i = 0; i < taskList.length; i++) {
			if (taskList[i]) {//如果存在taskList[i]
				if (taskList[i].done) {
					doneTask[i] = taskList[i];
				}
				else {
					var $taskLi = renderTaskTemplate(taskList[i],i);
					$taskListUl.append($taskLi);
				}
			}
		}

		for (var j = 0; j < doneTask.length; j++) {
			$taskLi = renderTaskTemplate(doneTask[j],j);
			if($taskLi) {
				$taskLi.addClass('done');
				$taskListUl.append($taskLi);
			}
			
		}

		$delete = $('.delete');//由于delete是在这条语句之前的执行完后才动态生成的，所以要在这里动态地获取delete
		lisitenDelete();//每次动态监听删除事件

		$detail = $('.detail');
		lisitenDetail();

		$checkbox = $(':checkbox');//input[type=checkbox]可以简写成:checkbox
		listenCheckbox();

	}

	function renderTaskTemplate (data,i) {
		if(!data || i==undefined) return;
		var template = `
		<li class="task-li" data-index="${i}">
			<input type="checkbox" ${data.done ? 'checked' : ''}>
			<span class="task-content">${data.content}</span>
			<span class="fr">
				<span class="detail">定时提醒</span>
				<span class="delete" title="点击删除这条记录">删除</span>
			</span>
		</li>`;
		return $(template);
	}

	function deleteTask (index) {
		//如果没有index或者index不存在
		// !index 不能用这种形式，因为要考虑到index=0的情况
		if (index === undefined || !taskList[index]) return;
		delete taskList[index];
		refreshStore();

	}

	function taskRemindCheck () {
		var currentTime, taskTime;
		var timer;
		timer = setInterval(function () {
			for (var i = 0; i < taskList.length; i++) {
				var data = getDataFromStore(i);
				if (data && data.date && !data.isReminded) {
					currentTime = (new Date()).getTime();
					taskTime = (new Date(data.date)).getTime();

					if (currentTime - taskTime >= 1) {
						showMsg(data.content);
						updateTask(i,{isReminded : true});
					}
				}
			}			
		},500);
	}

	function showMsg (content) {
		if (!content) return;
		$alert[0].play();//将jq转成js对象后，使用play()
		$msg.slideDown();
		$msgP.html(content);
	}

	function hideMsg () {
		$msg.slideUp();
		$msgP.html('');
	}
//利用浏览器的关闭事件，关闭页面时执行localStorage的清除方法即可！
	// window.onunload=function(){
	// 	store.clear();
	// }
})();