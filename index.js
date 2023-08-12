
// IMPORT FILES
import express from "express";
import bodyParser from "body-parser";
import { dirname } from "path";
import { fileURLToPath } from "url";
import {Task} from './task.js';
import mongoose from 'mongoose';
import _ from 'lodash';
import { error } from "console";


// SETTING SERVER
const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const port = 3001;

// APP USE
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + '/public'));

// CONNECT TO DATABASE
mongoose.connect('mongodb://127.0.0.1:27017/toMyDoListDB');

// ITEM SCHEMA
const {Schema} = mongoose;
const itemsSchema = new Schema({
  name:String,
});

// ITEM MODEL
const Item = mongoose.model('Item', itemsSchema);

// DEFAULT DATA FOR ITEM MODEL
const item1 = new Item({
  name: "Programing"
});

const item2 = new Item({
  name: "Reading"
});

const item3 = new Item({
  name: "Make 1M $"
});

// LIST OF DEFAULT ITEMS
const defaultItems = [item1, item2, item3];

//List schema
const listSchema = new Schema({
  name: String,
  items: [itemsSchema]
});

// List model
const List = mongoose.model("List", listSchema);

// SHOW ALL ITEMS 
app.get("/", (req, res) => {

  Item.find().then((data) => {
    // IF no data, add default data
    if(data.length === 0){
      Item.insertMany(defaultItems);
      res.render("index.ejs", {listTitle: "Today", tasks: data});
    }
    else {
      // Show all tasks on page
      res.render("index.ejs", {listTitle: "Today", tasks: data});
    }
  }).catch((err)=>{
    // If error exist, print the error
    console.log(err);
  });
});


// ADD NEW ITEM 
app.post('/', (req, res) => {
    // new item for database
    const item = new Item({
      name: req.body.newItem
    });

    if(req.body.list == "Today"){
      // save item into database Today 
      item.save();
      // redirect to home page
      res.redirect("/")
    }
    else {
      // Save item to specific model with name
      List.findOne({name: req.body.list}).then((foundList) => {
        // add item into array
        foundList.items.push(item);
        foundList.save();
        // redirect to page with items
        res.redirect("/" + req.body.list );
      }).catch((err) => {
        // If error exist, print the error
        console.log(err);
      })
    }    
});

// DELETE ITEM
app.post("/delete", function(req, res){
  // name of list from request
  const listName = req.body.list;
  //id of item from request
  const searchId = req.body.checkbox;
  if(listName== "Today"){
      // delete item by id
      Item.deleteOne({_id: searchId}).then(function(data){
         // succesfull delete
        console.log("Item deleted");
      }).catch(function(err){
        // if error exist, print the error
        console.log(err);
      });
      // rediret to home page 
      res.redirect("/");
  }
   else {
    // find the list by the name and remove item in list by id of the item
    List.findOneAndUpdate({name: listName }, {$pull: {items: {_id: searchId}}}).then((data) =>{
      // succesfull delete
      console.log("Item deleted");
    }).catch((err) => {
       // if error exist, print the error
      console.log(err);
    });
     // rediret to home page 
    res.redirect("/" + listName );
  } 
});

// show all item for specific list
app.get('/:customListName', (req,res) =>{
  // capitalize name of the list
  const customListName = _.capitalize(req.params.customListName);
  // find the list by the name
  List.findOne({name: customListName}).then((data) => {
    // if list doesnt exist create it and set default items into it
    if (data === null){
      const list= new List({
        name: customListName,
        items: defaultItems
      });
      list.save();
      res.redirect("/" + customListName);
    }
    else {
      // if list exist create, show it on page
      res.render("index.ejs", {listTitle: customListName, tasks: data.items});
    }
  });
});

// RUNNING SERVER
app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});




