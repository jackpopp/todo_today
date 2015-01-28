List = function(ko)
{
	if (ko === undefined || typeof ko !== 'object')
		throw new Error('Initialize with instanse of knockout')

	root = this;
	this.ko = ko;

	this.newItemTitle = this.ko.observable();
	this.selectedEditItem = this.ko.observable();
	this.editItemTitle = this.ko.observable();
	this.hoursLeft = this.ko.observable();
	this.minutesLeft = this.ko.observable();
	this.showEditScreen = this.ko.observable(false);
	this.items = this.ko.observableArray([]);

	this.key = 'todo_items';

	this.totalItems = this.ko.computed(function(){
		return root.items().length
	})

	this.itemsCompleted = this.ko.computed(function(){
		val = 0

		for (i = 0; i < root.items().length; i++)
		{
			if (root.items()[i].complete())
				val++;
		}

		return val;
	})

	this.init();

	return this;
}

List.prototype = {

	init: function()
	{
		view = document.querySelectorAll('.js-list-binding')[0];
		ko.applyBindings(this, view);
		this.updateCountdown()
		this.load()

		setInterval(function(){
			root.updateCountdown()
		}, 60)
		
	},

	addItem: function(title, uuid, complete)
	{

		this.items.push({
			title:this.ko.observable(title), 
			uuid: (uuid === undefined) ? new Date().getTime() : uuid,
			complete: complete ? this.ko.observable(true) : this.ko.observable(false)
		})

		this.resetNewItemTitle()
		root.save();
	},

	resetNewItemTitle: function()
	{
		this.newItemTitle(undefined);
	},

	toggleComplete: function(data)
	{
		data.complete() ? data.complete(false) : data.complete(true);
		root.items.notifySubscribers();
		root.save();
	},

	deleteItem: function(item)
	{
		root.items.remove(item);
		root.save();
	},

	toggleEdit: function(item)
	{
		// if edit item is true and the item passed is the same as the selected item
		// set false unset selected
		if (root.showEditScreen() && item === root.selectedEditItem())
		{
			root.setEditScreen(false);
			root.editItemTitle(undefined);
		}
		// if edit item is true and the passed item isnt the select item then swap selected keep true
		else if (root.showEditScreen() && item !== root.selectedEditItem())
		{
			root.selectedEditItem(item);
			root.editItemTitle(item.title());
		}
		// if edit item is set to false then set to true and set selected item
		else
		{
			root.setEditScreen(true);
			root.selectedEditItem(item);
			root.editItemTitle(item.title());
		}
	},

	updateEditItem: function()
	{
		root.setEditScreen(false);
		root.selectedEditItem().title(root.editItemTitle());
		root.editItemTitle(undefined);
		root.save();
	},

	setEditScreen: function(val)
	{
		root.showEditScreen(val);
	},

	updateCountdown: function()
	{
		current = new Date();
		end = this.getEndDate();
		diff = end - current;

		hours = this.addZeroIfBelowTen(Math.round(diff / 1000 / 60 / 60));
		minutes = this.addZeroIfBelowTen(Math.round(diff / 1000 / 60 % 60));

		this.hoursLeft(hours);
		this.minutesLeft(minutes);
	},

	getEndDate: function()
	{
		return new Date().setHours(24, 00);
	},

	dataExpired: function(endDate)
	{
		return (new Date() > endDate);
	},

	addZeroIfBelowTen: function(val)
	{
		return val < 10 ? '0'+val : val;
	},

	itemsToJson: function()
	{
		temp = [];

		for (var i = root.items().length - 1; i >= 0; i--) {
			temp.push({
				title: root.items()[i]['title'](),
				complete: root.items()[i]['complete'](),
				uuid: root.items()[i]['uuid']
			});
		};

		return JSON.stringify({items: temp, endDate: this.getEndDate()});
	},

	save: function()
	{
		localStorage.setItem(this.key, root.itemsToJson());
	},

	load: function()
	{
		data = JSON.parse(localStorage.getItem(this.key));

		// if the data doesnt exist then create it and save in local storage
		if (data === null || ( ! data.hasOwnProperty('items')) || ( ! data.hasOwnProperty('endDate')))
			return this.resetData();

		items = data['items'];
		endDate = new Date(data['endDate']);

		if (this.dataExpired(endDate))
			return this.resetData();

		for (var i = items.length - 1; i >= 0; i--) {
			root.addItem(items[i]['title'], items[i]['uuid'], items[i]['complete']);
		};
	},

	resetData: function()
	{
		// reset the data here and set the new enddate
		localStorage.setItem(this.key, JSON.stringify({list: [], endDate: this.getEndDate()}));
	},

	dayIsOver: function()
	{
		// check that current day is over
	}

}

function setHeight()
{
	height = (window.innerHeight - 100) > 220 ? window.innerHeight : 220
	document.querySelectorAll('.js-main-container')[0].style.height = height+"px"
	document.querySelectorAll('.js-container')[0].style.height = height+"px"

	infoHeight = document.querySelectorAll('.js-info')[0].offsetHeight
	inputHeight = document.querySelectorAll('.js-inputs')[0].offsetHeight

	infoHeight = (infoHeight + inputHeight) 
	// need to remove the amount of padding thats on the cotinaer also

	document.querySelectorAll('.js-list')[0].style.height = (height - infoHeight)+"px"
	document.querySelectorAll('.js-list')[0].style.paddingBottom = (parseInt(window.getComputedStyle(document.querySelectorAll('.js-container')[0], null).getPropertyValue('padding'))*2)+'px'
}

window.onload = function()
{
	list = new List(ko);
	setHeight()
	window.onresize = function(){
		setHeight()
	}

}


// set list height to fit in between top and bottom size and scroll