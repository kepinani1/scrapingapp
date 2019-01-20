//Adding other relevant depencies
var express = require('express');
var router = express.Router();
var path = require('path');

//Adding cheerio
var request = require('request');
var cheerio = require('cheerio');

//Require models ((which are labeled as Input.js and News.js in models folder))
var Input = require('../models/Input.js');
var New = require('../models/New.js');

//index
router.get('/', function(req, res) {
    res.redirect('/news');
});

// A GET request to scrape the cosmopolitan website
router.get('/scrape', function(req, res) {
    // First, we grab the body of the html with request
    request('https://www.cosmopolitan.com/entertainment/', function(error, response, html) {
        // Then, we load that into cheerio and save it to $ for a shorthand selector
        var $ = cheerio.load(html);
        var titlesArray = [];
        // Now, we grab every piece of news
        $('div.full-item').each(function(i, element) {
            // Save an empty result object
            var result = {};

            // Add the text and href of every link, and save them as properties of the result object
            result.title = $(this).children('div.full-item-content').children('a').text();
            // result.link = $(this).children('a').children('img').attr('src');
            //given link is only partially provided without the 'https://www.cosmopolitan.com' in front, I tried to add it in to the very beginning of what was pulled to make it a full link
            result.link = "https://www.cosmopolitan.com" + $(this).children('div.full-item-content').children('a').attr('href');

            //could not scrape image from site. I tried various methods of trying to retrieve the images from 'Cosmopolitan' but could not. Below is the scrapping method I tried to use.
            // result.img = $(this).children('a.item-image').children('img.lazyimage lazyautosizes lazyloaded').attr('src'); //Add
            
            //ensures that no empty title, links or images are sent to mongodb
            if(result.title !== "" && result.link !== ""){//would have added code of '&& result.img' but because I couldn't scrape the image, I did not add it.
              //check for duplicates
              if(titlesArray.indexOf(result.title) == -1){

                // push the saved title to the array 
                titlesArray.push(result.title);

                
                New.count({ title: result.title}, function (err, test){
                    //testing if unique
                  if(test == 0){

                    //using New model, create new object
                    var entry = new New (result);

                    //save entry to mongodb
                    entry.save(function(err, doc) {
                      if (err) {
                        console.log(err);
                      } else {
                        console.log(doc);
                      }
                    });

                  }
            });
        }
        else{
          console.log('Sorry, it appears you already have that...Try again.')
        }

          }
          else{
            console.log('Not saved to DB, missing data')
          }
        });
        // Redirecting to index
        res.redirect('/');
    });
});

//this will grab every piece of news and populate the DOM
router.get('/news', function(req, res) {
    //allows newer articles to be on top
    New.find().sort({_id: -1})
        //send to handlebars
        .exec(function(err, doc) {
            if(err){
                console.log(err);
            } else{
                var newsLog = {new: doc};
                res.render('index', newsLog);
            }
    });
});

// This will get the news we scraped from the mongoDB in JSON
router.get('/news-json', function(req, res) {
    New.find({}, function(err, doc) {
        if (err) {
            console.log(err);
        } else {
            res.json(doc);
        }
    });
});

//clear all
router.get('/clearAll', function(req, res) {
    New.remove({}, function(err, doc) {
        if (err) {
            console.log(err);
        } else {
            console.log('removed all news');
        }

    });
    res.redirect('/news-json');
});

router.get('/readNews/:id', function(req, res){
  var newId = req.params.id;
  var hbsObj = {
    new: [],
    body: []
  };

    // //find the new id
    New.findOne({ _id: newId })
      .populate('input')
      .exec(function(err, doc){
      if(err){
        console.log('Error: ' + err);
      } else {
        hbsObj.new = doc;
        var link = doc.link;
        //grab news from link
        request(link, function(error, response, html) {
          var $ = cheerio.load(html);
//Tried to scrape the article body content but could not get it to appear on the page after user clicks 'Read News and Leave Your Input' button.
          $('div.standard-body').each(function(i, element){
            hbsObj.body = $(this).children('div.article-body-content').children('p').text();
            //send news body and comments to new.handlbars through hbObj
            res.render('new', hbsObj);
            
            return false;
          });
        });
      }

    });
});

// Create a new comment
router.post('/input/:id', function(req, res) {
  var user = req.body.name;
  var content = req.body.input;
  var newId = req.params.id;

  //submitted form
  var inputObj = {
    name: user,
    body: content
  };
 
  //using the Input model, create a new comment from user
  var newInput = new Input(inputObj);

  newInput.save(function(err, doc) {
      if (err) {
          console.log(err);
      } else {
          console.log(doc._id)
          console.log(newId)
          New.findOneAndUpdate({ "_id": req.params.id }, {$push: {'input':doc._id}}, {new: true})
            //execute everything
            .exec(function(err, doc) {
                if (err) {
                    console.log(err);
                } else {
                    res.redirect('/readNews/' + newId);
                }
            });
        }
  });
});

module.exports = router;