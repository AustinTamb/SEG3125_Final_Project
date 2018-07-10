// Holds recipes pulled from the jquery
var recipes = [];

// Following just adds jquery event listeners on search bar elements.
$(document).ready(function () {
    // This pulls data to populate website with recipes
    $.getJSON("https://api.myjson.com/bins/1emevu", function (data) {
        var tmp = [];
        $.each(data, function (k, v) {
            tmp.push(v);
        });
        recipes = tmp;
    });

    //Pretty much every time the user enters a new keyvalue
    $("#search_recipe").on("keyup", function () {
        searchChanged();
    });

    // When the user changes the keyword category
    $("#search_category", "#search_recipe").on("change", function () {
        searchChanged();
    });

    // When the user clicks on the search button
    $("#btn_search").on("click", function () {
        searchChanged();
    });
});

function searchChanged() {
    // Gets the search query values such as the input and the selected keyword category
    var category = $("#search_category").val().toLowerCase().replace(/\s+/g, '');
    var keywords = $("#search_recipe").val().toLowerCase().replace(/\s+/g, '').split(",");
    // Update the query results
    setSearchResult(keywords, category);
}

function displayInfo(id) {
    // Populates the recipe summary modal with necessary information
    document.getElementById("recipeInfoName").innerHTML = recipes[id].name;
    document.getElementById("recipeInfoImg").src = recipes[id].image;
    var ingredients = recipes[id].ingredients;
    var tmp = "";
    for (i in ingredients) {
        tmp += '<li>{amount} {item}</li>'.replace("{item}", ingredients[i].name).replace("{amount}", ingredients[i].amount);
    }
    document.getElementById("recipeInfoIng").innerHTML = '<h4>Ingredients:</h4><ul>' + tmp + '</ul>';
    document.getElementById("recipeInfoDur").innerHTML = "Estimated duration: " + recipes[id].duration + " minutes";
    $("#recipeInfo").modal();
    $("#btn_startCooking").on("click", function () {
        document.getElementById("btn_startCooking").onclick = startCooking(id);
    })
}

function setSearchResult(keywords, category) {
    // Behemoth that completes the query.
    // temp value to store "cleaned" string
    var tmp;
    // temp list to hold recipes that match the query
    var meeting_recipes = [];
    // Temporary value to hold the keyword to check (keyword without the '!' chars at the front if they were entered)
    var keyword;
    // temp variable to store if the keyword was found
    var found;
    // Wether all the conditions entered by the user are valid
    var all_valid;
    // regex used to get the '!' chars from the start of a string. (This allows multiple negation)
    var reg = /^[!]+/;
    // temp variable to hold the results of the regex
    var test;
    // temp variable to make working with sub-arrays easier
    var ingredients;

    // Looping through recipes first since you only want to check all of those values once
    for (j in recipes) {
        // Assume that all the keywords are valid from the start.
        all_valid = true;
        for (i in keywords) {
            keyword = keywords[i];
            // get all the consecutive '!' at the start of the keyword
            test = reg.exec(keyword);

            // if test is not null, we know there's at least 1 '!', making it a possible not keyword.
            if (test != null) {
                // get the string value extracted
                test = test[0];
                // If if there's an even amount of '!' we know they all negate eachother
                not_keyword = (test.length % 2) != 0;
                // Set the temp keyword to the original and remove all characters meeting the regex condition
                keyword = keywords[i].replace(reg, '');
            } else {
                // Don't need to worry about not keywords, just use the entered keyword
                not_keyword = false;
                keyword = keywords[i]
            }
            // If following is true, we don't want to update query. Pretty much checks if empty or recipe value undefined and not any category
            if ((recipes[j][category] == undefined || keyword.length == 0) && category != "any") continue;

            if (category == "ingredients") {
                // Since ingredients are stored in an array of objects, we need to go through all of them
                ingredients = recipes[j][category];

                // We only search for the name, and if the name is found or shouldn't be there
                for (k in ingredients) {
                    tmp = ingredients[k].name.toLowerCase();
                    found = tmp.indexOf(keyword) != -1;
                    all_valid = !(not_keyword && found);
                    if (found || !all_valid) break;
                }
            } else {
                // If category is any, just add all relevant information into a single string
                if (category == "any") {
                    tmp = recipes[j].name + recipes[j].duration;
                    for (k in recipes[j].ingredients) {
                        tmp += recipes[j].ingredients[k].name;
                    }
                    tmp = tmp.toLowerCase().replace(/\s+/g, '');
                } else {
                    // Otherwise just get the value from directly accessing it by its key name
                    tmp = recipes[j][category].toLowerCase().replace(/\s+/g, '');
                }
                found = tmp.indexOf(keyword) != -1;

                // logic here is that you can't have something that found and not found (if found and supposed to not be found then false, don't really care about the rest)
                if (found != not_keyword) all_valid = false;
            }
            // If all the keywords are invalid, remove the recipe otherwise add it. Only try to add/remove if it's not/already in the array. 
            if (!all_valid) {
                if (meeting_recipes.indexOf(recipes[j]) != -1) meeting_recipes.pop(recipes[j]);
                // break keywords loop and move on to next recipe
                break;
            } else {
                if (meeting_recipes.indexOf(recipes[j]) == -1) meeting_recipes.push(recipes[j]);
            }
        }
    }
    // Hold the result container DOM
    var result_container = document.getElementById("search_result_container");
    if (document.getElementById("search_recipe").value == "") {
        // If query is empty, put in empty table (This is done if the user removes his input, otherwise it would remain as the past one).
        result_container.innerHTML = '<table class="table table-hover"><thead><tr class="d-flex"><th class="col-9">Name</th><th class="col-3">Duration</th></tr></thead><tbody id="search_results"></tbody></table>';
        return;
    } else if (meeting_recipes.length == 0) {
        // Give error instead of table if there's no results
        result_container.innerHTML = '<div class="alert alert-danger alert-dismissible shadow-sm"><a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a><strong>No result found!</strong> Unfortunately there were no recipes found meeting the specified criteria.</div>'
        return;
    }
    // Set the inner DOM of the results to the table
    result_container.innerHTML = '<table class="table table-hover"><thead><tr class="d-flex"><th class="col-9">Name</th><th class="col-3">Duration</th></tr></thead><tbody id="search_results"></tbody></table>';
    // Basic template for the query result table
    var template = '<tr class="d-flex" onclick="displayInfo({id});"><th class="col-9">{name}</th><th class="col-3">{duration} minutes</th></tr>';
    // reuse the tmp value
    tmp = "";

    // Add all recipes obtained by the query
    for (i in meeting_recipes) {
        tmp += template.replace("{name}", meeting_recipes[i].name).replace("{duration}", meeting_recipes[i].duration).replace("{id}", meeting_recipes[i].id);
    }

    // add it to the container
    document.getElementById("search_results").innerHTML = tmp;
}

function startCooking(recipeId) {
    // Store the selected recipe id in the locaStorage
    localStorage.setItem("recipeId", recipeId);
    // Switch to the recipe page
    window.location = "recipe.html";
}

function generateRecipePage() {
    // pretty much just puts fills the recipe.html page with the recipe data.
    $.getJSON("https://api.myjson.com/bins/1emevu", function (data) {
        var tmp = [];
        $.each(data, function (k, v) {
            tmp.push(v);
        });
        recipes = tmp;
        var id = localStorage.getItem("recipeId");
        var inst = document.getElementById("instructions_container");
        var steps = recipes[id].steps;
        tmp = "<ul>";
        for (i in steps) {
            if (steps[i].type == "timer") {
                tmp += '<li><label class="form-check-label"><input type="checkbox" class="form-check-input" value="">{instruction}</label><li><button class="btn btn-success" onclick="waitStep({time});"><i class="fa fa-play"></i> Start Timer</button></li></li>'.replace("{instruction}", steps[i].instruction).replace("{time}", steps[i].time);
            } else {
                tmp += '<li><label class="form-check-label"><input type="checkbox" class="form-check-input" value="">{instruction}</label></li>'.replace("{instruction}", steps[i].instruction);
            }

        }
        inst.innerHTML = tmp + "</ul>";

        var ing = document.getElementById("ingredients_container");
        var ingredients = recipes[id].ingredients;
        tmp = "<ul>";
        for (i in ingredients) {
            tmp += '<li><label class="form-check-label"><input type="checkbox" class="form-check-input" value="">{amount} {ingredient}</label></li>'.replace("{ingredient}", ingredients[i].name).replace("{amount}", ingredients[i].amount);
        }
        ing.innerHTML = tmp + "</ul>";
    });
}

function waitStep(time) {
    // Turn minute wait time into ms (m * 60s/min * 1000ms/s), put the video in fullscren and play the video.
    var ms_time = parseInt(time) * 60 * 1000;
    var video = document.getElementById("video");

    if (video.requestFullscreen) {
        video.requestFullscreen();
    } else if (video.mozRequestFullScreen) {
        video.mozRequestFullScreen();
    } else if (video.webkitRequestFullscreen) {
        video.webkitRequestFullscreen();
    } else if (video.msRequestFullscreen) {
        video.msRequestFullscreen();
    }
    video.play();

    stopWait(ms_time).then(() => {
        // Once the sleep is done, exit the fullscreen, pause the video and alert the user about the cooking time being done.
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
        document.getElementById("video").pause();
        alert("The cooking time is done. The video has been paused for you.");
    });
}

function stopWait(time) {
    // Best way to have a sleep in JS
    return new Promise((resolve) => setTimeout(resolve, time));
}