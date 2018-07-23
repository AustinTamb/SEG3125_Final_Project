# SEG3125_Final_Project
The website can be accessed by going on https://austintamb.github.io/SEG3125_Final_Project/index.

This is a website made for SEG3125 as a final project.

# Data Stuff

The recipes are stored in a json and hosted through an api provided by myjson.com. Using this json, we then populate the webpage with the information they store.

The json stores a list of objects containing the following information:
* id: Unique identifier for each recipe
* name: The name of the recipe
* ingredients: list of ingredients which are json objects with the following objects: 
  * name: name of the ingredient
  * amount: amount of the ingredient (Must also contain the measure of quantity)
* duration: estimated time (in minutes) to complete the recipe.
* steps: steps necessary to complete the recipe, it is a list of objects with the following information:
   * type: the type of step (normal or timer)
   * instruction: the instruction
   * time: by default -1, if timer step, you put the time in minutes of the timer.
    
# Other Stuff
More information can be found by looking a the javascript code which is contained in /js/main.js.
Frameworks used are Bootstrap 4 and jQuery. The icons provided by font awesome are also used as Bootstrap 4 no longer contains glyphicons.
The images were found online. The original colour scheme is included in the directory as colors_\*.png, however the colours we planned to use have changed in order to improve the U.I based off feedback received by various peers.
The U.I has been designed to be responsive and simplistic in order to allow the find of recipes to be simple and convenient to follow.

Some minor features that would have been nice to have are:
* Checkbox in the timer to select if the user wants to save the time when exiting rather than a confirm dialog on exit.
* Login system to allow users to save recipes. (As recipes have unique IDs all we would need to store is a list with those ids)
* Progress bar for the recipe as steps are completed
* Recipe suggestion
* Built-in playlist
 
These features mentionned above were not implemented as they would require too much time and effort to implement while they were also not planned to be implemented. 

