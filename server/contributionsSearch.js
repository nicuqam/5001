import { Articles } from '../imports/api/articles.js';

if (Meteor.isServer) {
    Meteor.methods({
        'searchContributions': function (user, url, continueParam, uccontinueParam) {

            /*
            À MODIFIER RAPIDEMENT : WIPE DE LA BD À CHAQUE RECHERCHE
            */
           
          console.log(user);
          console.log(url); 
          
          if(continueParam === null) {
            Articles.remove({});  
            
            response = HTTP.get(url, {
                params: {
                    "action": "query",
                    "list": "usercontribs",
                    "format": "json",
                    "uclimit": 10,
                    "ucuser": user,
                    "ucdir": "older",
                    "ucnamespace": 0,
                    "ucprop": "ids|title|timestamp|comment|size|sizediff",
                    "converttitles": ""
                }
            });
            
          } else {
            
            response = HTTP.get(url, {
                params: {
                    "action": "query",
                    "list": "usercontribs",
                    "format": "json",
                    "uclimit": 10,
                    "ucuser": user,
                    "ucdir": "older",
                    "ucnamespace": 0,
                    "ucprop": "ids|title|timestamp|comment|size|sizediff",
                    "converttitles": "",
                    "continue": continueParam,
                    "uccontinue": uccontinueParam
                }
            });
            
          }

          
          if( (typeof response.data.error === 'undefined') 
                    && response.data.query.usercontribs.length > 0) {
              
              if (typeof response.data.continue !== 'undefined') {
                continueParam = response.data.continue.continue;
                uccontinueParam = response.data.continue.uccontinue;
              }

              console.log(response.data.query.usercontribs);
              Meteor.call('buildArticles', url, response.data.query.usercontribs);
                
          } else {
            
            continueParam = null;
            uccontinueParam = null;
            
          };

          console.log(continueParam);
          console.log(uccontinueParam);
            
          return [continueParam, uccontinueParam];

        },
        
        //Requete vers API pour obtenir les 10 prochaines contributions

        //Construction de la BD d'objets
        'buildArticles': function (url, response) {
            console.log("buildArticles start")

            for (i = 0; i < response.length; i++) {
                var result = response[i];
                var userId = result.userid;
                var user = result.user;
                var pageId = result.pageid;
                var revId = result.revid;
                var parentId = result.parentid;
                var ns = result.ns;
                var title = result.title;
                var timestamp = result.timestamp;
                var comment = result.comment;
                var size = result.size;
                var sizeDiff = result.sizediff;

                Articles.insert({
                    userId,
                    user,
                    pageId,
                    revId,
                    parentId,
                    ns,
                    title,
                    timestamp,
                    comment,
                    size,
                    sizeDiff,
                    createdAt: new Date(),
                    url: url
                });
            }
        },

        // Selection des articles

        'selectArticle': function(revisionID) {
            console.log("selectArticle start");
            
            var newText;
            var oldText;
            var analysisTable;
            
            newText = Meteor.call('getArticleText', Articles.findOne({ revId: revisionID}).url, 
                                                    Articles.findOne({ revId: revisionID}).revId);
            oldText = Meteor.call('getArticleText', Articles.findOne({ revId: revisionID}).url,
                                                    Articles.findOne({ revId: revisionID}).parentId);
            
            analysisTable = Meteor.call('getDiff', oldText, newText);
            console.log(analysisTable);
            
            return analysisTable;
        },
        
        
        'getArticleText': function (url, revisionID) {
            console.log("getArticleText");
            
            response = HTTP.get(url, {
                params: {
                    "action": "parse",
                    "format": "json",
                    "oldid": revisionID,
                    "prop": "text"
                }
            });
            return response.data.parse.text["*"];p
        }

    });
}
