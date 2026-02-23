// Arlind zalli
// 1/6/25
// A dodgeball game with powerups, blocks, collision detection, health, and an opponent!

var balls = [];
var players = [];
var blocks = [];
var items = [];
var itemTypeList = ["heal", "blocks", "super"];

var page = 0;
var HP = 1;
var blockCooldown = 500;
var ballDurability = 3;
var powerupTimer = 0;

// Key handling for player movement
var keys = { w: false, a: false, s: false, d: false, q: false, e: false, r: false, f: false, i: false, j: false, k: false, l: false, u: false, o: false, p: false, h: false };

// Detects when a key is pressed, and sets the respective key variable to true.
var keyPressed = function() {
    if (keys.hasOwnProperty(key)) {
        keys[key] = true;
    }
    // Enables shooting for all players
    for (var i = 0; i < players.length; i++) {
        players[i].canShoot = true;
    }
};

// Detects when a key is released, and resets the respective key variable to false.
var keyReleased = function() {
    if (keys.hasOwnProperty(key)) {
        keys[key] = false;
        
        // If the key corresponds to firing a ball, allow players to shoot again.
        if (key === 'r' || key === 'p') {
            for (var i = 0; i < players.length; i++) {
                players[i].canShoot = true;
            }
        }
        
        // If the key corresponds to placing a block, allow players to place blocks again.
        if (key === 'f' || key === 'h') {
            for (var i = 0; i < players.length; i++) {
                players[i].canPlace = true;
            }
        }
    }
};

// A function that draws the user's arrow, which directs the ball.
// Parameters: 
// x, y: coordinates of the arrow's rotation point.
// size: length of the arrow in pixels.
// angle: direction the arrow should point.
var drawArrow = function(x, y, size, angle) {
    var endX = x + cos(angle) * size;
    var endY = y + sin(angle) * size;
    stroke(0);
    strokeWeight(2);
    line(x, y, endX, endY);
};

// Creates a button and returns a value based on interaction.
// Parameters: 
// item: value to be changed. 
// type: "inc" for increment, "set" for setting a value.
// edit: increment value or set value.
// x, y: coordinates of the button.
// width, height: dimensions of the button.
// txt: label on the button.
// color: button color.
// extension: extra width for the button if text overflows.
var button = function(item, type, edit, x, y, width, height, txt, color, extension) {
    fill(color);
    rect(x, y, width + extension, height);
    fill(0);
    textSize(height * 0.75);
    text(txt, x + (width * 0.1), y + (height * 0.8));
    
    // Check if the mouse is hovering over the button.
    if (mouseX > x && mouseX < x + width && mouseY > y && mouseY < y + height) {
        fill(0);
        ellipse(x - 10, y + (height * 0.5), 8, 8);
        
        // Check if the button is clicked.
        if (mouseIsPressed) {
            if (type === "inc") {
                return item + edit;
            } else if (type === "set") {
                return edit;
            }
        }
    }
    return item;
};

// Creates a new ball with specific properties and adds it to the list of balls.
var newBall = function(x, y, xvel, yvel, friction, color, bounces) {
    balls.push({ 
        x: x, 
        y: y, 
        xvel: xvel, 
        yvel: yvel, 
        friction: friction, 
        color: color, 
        bounces: bounces
    });
};

// Creates a new item with specific properties and adds it to the list of items.
var newItem = function(x, y, type) {
    items.push({
        x: x, 
        y: y, 
        type: type
    });
};

// Creates a new block with specific properties and adds it to the list of blocks.
var blockPlace = function(x, y, color) {
    blocks.push({ 
        x: x, 
        y: y, 
        color: color
    });
};

// Creates a new player with specific properties and adds it to the list of players.
var newPlayer = function(x, y, color, lives, keys, pointer, reloadTime, blocks, ballVelocity) {
    players.push({
        x: x,
        y: y,
        xvel: 0,
        yvel: 0,
        color: color,
        lives: lives,
        blocks: blocks,
        keys: keys,
        pointer: pointer,
        canShoot: true,
        canPlace: true,
        lastShotTime: 0,
        lastBlockTime: 0,
        reloadTime: reloadTime,
        ballVelocity: ballVelocity
    });
};

// Checks if an item is touched by any player and applies its effect.
var itemTick = function(item) {
    for (var i = 0; i < players.length; i++) {
        var player = players[i];
        if (player.x + 21 > item.x && player.x < item.x + 8 && player.y + 21 > item.y && player.y < item.y + 8) {
            if (item.type === "heal") {
                player.lives += 1;
            } else if (item.type === "blocks") {
                player.blocks += 1;
            } else if (item.type === "super") {
                player.ballVelocity = 10;
            }
            item.x = 0;
            item.y = 0;
            item.type = "";
        }
    }
};

// Checks for collisions between a ball and all blocks.
var checkBallBlockCollision = function(ball) {
    var ballSize = 10;
    for (var i = 0; i < blocks.length; i++) {
        var block = blocks[i];
        if (ball.x + ballSize > block.x && ball.x < block.x + 20 && ball.y + ballSize > block.y && ball.y < block.y + 20) {
            if (abs(ball.x - block.x) < abs(ball.y - block.y)) {
                ball.yvel = -ball.yvel; 
            } else {
                ball.xvel = -ball.xvel; 
            }
            ball.bounces -= 1;
            return true;
        }
    }
    return false;
};

// A function that updates the state of a ball.
// ball: the ball object being updated.
var ballTick = function(ball) {
    // Update the position of the ball based on its velocity.
    ball.x += ball.xvel;
    ball.y += ball.yvel;

    // Check if the ball collides with any blocks.
    checkBallBlockCollision(ball);

    // Apply friction to gradually slow down the ball's velocity.
    if (ball.xvel < 0) {
        ball.xvel += ball.friction;
    } else if (ball.xvel > 0) {
        ball.xvel -= ball.friction;
    }
    if (ball.yvel < 0) {
        ball.yvel += ball.friction;
    } else if (ball.yvel > 0) {
        ball.yvel -= ball.friction;
    }

    // Handle ball collisions with the walls (horizontal and vertical).
    if (ball.x < 50 || ball.x > 350) {
        ball.xvel = -ball.xvel; // Reverse the x-velocity upon collision.
        ball.x = constrain(ball.x, 50, 350); // Ensure the ball stays within bounds.
        ball.bounces -= 1; // Reduce the remaining bounces.
    }
    if (ball.y < 50 || ball.y > 350) {
        ball.yvel = -ball.yvel; // Reverse the y-velocity upon collision.
        ball.y = constrain(ball.y, 50, 350); // Ensure the ball stays within bounds.
        ball.bounces -= 1; // Reduce the remaining bounces.
    }

    // Check if the ball hits any players.
    for (var i = 0; i < players.length; i++) {
        var player = players[i];
        // Check if the ball is within range of the player's hitbox.
        if (abs(ball.x + 5 - player.x - 10) < 10 && abs(ball.y + 5 - player.y - 10) < 10 && ball.color !== player.color) {
            player.lives -= 1; // Reduce the player's health.
            ball.bounces = 0; // Deplete the ball's remaining bounces, effectively destroying it.
        }
    }

    // Destroy the ball if it has no remaining bounces or if it hits a player.
    if (ball.bounces <= 0) {
        ball.x = 0; 
        ball.y = 0; 
        ball.xvel = 0; 
        ball.yvel = 0; 
        ball.friction = 0; 
        ball.color = 0; 
        ball.bounces = 0; // Reset all ball properties to "destroy" it.
    }
};

// A function to check if a player collides with any blocks.
// player: the player object to check.
var checkCollision = function(player) {
    var playerSize = 21; // Define the size of the player.
    for (var i = 0; i < blocks.length; i++) {
        var block = blocks[i];
        // Check if the player's hitbox overlaps with the block.
        if (player.x + playerSize > block.x && player.x < block.x + 20 && player.y + playerSize > block.y && player.y < block.y + 20) {
            player.xvel = -player.xvel; // Reverse the player's x-velocity upon collision.
            player.yvel = -player.yvel; // Reverse the player's y-velocity upon collision.
            return true; // Indicate that a collision occurred.
        }
    }
    return false; // No collision detected.
};

// A function to update a player's movement based on input and game mechanics.
// player: the player object to update.
var updatePlayerMovement = function(player) {
    player.xvel = 0; // Reset x-velocity.
    player.yvel = 0; // Reset y-velocity.

    if (player.keys === "wasd") { // Check if the player uses WASD controls.
        if (!checkCollision(player)) { // Ensure no block collision is present.
            // Update the player's velocity based on key input.
            if (keys.w) { player.yvel = -2; } // Move up.
            if (keys.s) { player.yvel = 2; }  // Move down.
            if (keys.a) { player.xvel = -2; } // Move left.
            if (keys.d) { player.xvel = 2; }  // Move right.
            if (keys.q) { player.pointer -= 3; } // Rotate pointer counter-clockwise.
            if (keys.e) { player.pointer += 3; } // Rotate pointer clockwise.
        }

        // Shooting logic for the player.
        if (keys.r && player.canShoot && millis() - player.lastShotTime > player.reloadTime) {
            // Create a new ball with the player's pointer direction and velocity.
            newBall(player.x, player.y, cos(player.pointer) * player.ballVelocity, sin(player.pointer) * player.ballVelocity, 0.001, player.color, ballDurability);
            player.lastShotTime = millis(); // Update the last shot time.
            player.canShoot = false; // Prevent immediate re-shooting.
        }

        // Block placement logic for the player.
        if (keys.f && millis() - player.lastBlockTime > blockCooldown && player.blocks > 0) {
            blockPlace(player.x - 20, player.y - 20, player.color); // Place a block near the player.
            player.blocks -= 1; // Reduce the player's available blocks.
            player.lastBlockTime = millis(); // Update the last block placement time.
        }
    }

    if (player.keys === "ijkl") { // Check if the player uses IJKL controls (second player).
        // Similar movement, shooting, and block placement logic for the second player.
        if (keys.i) { player.yvel = -2; } // Move up.
        if (keys.k) { player.yvel = 2; }  // Move down.
        if (keys.j) { player.xvel = -2; } // Move left.
        if (keys.l) { player.xvel = 2; }  // Move right.
        if (keys.u) { player.pointer -= 3; } // Rotate pointer counter-clockwise.
        if (keys.o) { player.pointer += 3; } // Rotate pointer clockwise.

        // Shooting logic for the second player.
        if (keys.p && player.canShoot && millis() - player.lastShotTime > player.reloadTime) {
            newBall(player.x, player.y, cos(player.pointer) * player.ballVelocity, sin(player.pointer) * player.ballVelocity, 0.001, player.color, ballDurability);
            player.lastShotTime = millis();
            player.canShoot = false;
        }

        // Block placement logic for the second player.
        if (keys.h && millis() - player.lastBlockTime > blockCooldown && player.blocks > 0) {
            blockPlace(player.x - 20, player.y - 20, player.color);
            player.blocks -= 1;
            player.lastBlockTime = millis();
        }
    }
};

var playerTick = function(player) {
    // Update the player's position based on their velocity.
    player.x += player.xvel;
    player.y += player.yvel;

    // Check for collisions with blocks. If no collision, update the player's movement.
    if (!checkCollision(player)) {
        updatePlayerMovement(player);
    }

    // Handle player collisions with the boundaries (walls).
    if (player.x < 50 || player.x > 328) {
        player.xvel = -player.xvel; // Reverse the x-velocity upon collision with horizontal boundaries.
        player.x = constrain(player.x, 50, 328); // Keep the player within bounds.
    }
    if (player.y < 50 || player.y > 328) {
        player.yvel = -player.yvel; // Reverse the y-velocity upon collision with vertical boundaries.
        player.y = constrain(player.y, 50, 328); // Keep the player within bounds.
    }

    // Check if the player's health has reached zero.
    if (player.lives <= 0) {
        // End the game and declare the winner based on the player's color.
        if (player.color === color(123, 216, 242)) {
            page = "p1"; // Player 1 (Pink) wins.
        } else if (player.color === color(235, 64, 198)) {
            page = "p2"; // Player 2 (Blue) wins.
        }
    }
};

// A function to display and update all objects in a given list.
// list: the list of objects (balls, blocks, players, or items).
// shape: the shape of the objects ("ellipse" or "square").
// size: the size of the objects.
var checkAll = function(list, shape, size) {
    for (var i = 0; i < list.length; i++) {
        var obj = list[i];
        fill(obj.color); // Set the fill color to the object's color.

        if (shape === "ellipse") {
            ellipse(obj.x, obj.y, size, size); // Draw the object as a circle.
        } else if (shape === "square") {
            rect(obj.x, obj.y, size, size); // Draw the object as a square.

            // Additional logic for specific object types.
            if (list === players) {
                // Display player stats (health, blocks, pointer direction).
                textSize(10);
                text(obj.lives + " HP", obj.x - 2, obj.y - 13);
                text(obj.blocks + " blocks", obj.x - 2, obj.y - 3);
                drawArrow(obj.x, obj.y, 15, obj.pointer); // Draw the player's pointer direction.
            } else if (list === items) {
                // Display item type (heal, blocks, or super).
                if (obj.type === "heal") {
                    fill(255, 115, 115); // Heal items are red.
                } else if (obj.type === "blocks") {
                    fill(255, 253, 117); // Block items are yellow.
                } else if (obj.type === "super") {
                    fill(209, 117, 255); // Super items are purple.
                }
                rect(obj.x, obj.y, size, size); // Draw the item.
                textSize(10);
                text(obj.type, obj.x - 1, obj.y - 2); // Display the item's type as text.
            }
        }
    }
};

// Main draw loop that runs continuously to render the game and update game logic.
draw = function() {
    // Handle the different pages of the game (menu, settings, gameplay, and results).
    if (page === 0) {
        // Initial page: display the title screen.
        if (balls.length === 0) {
            // Create initial balls for demonstration.
            newBall(60, 60, 10, 2, 0.000001, color(255, 186, 255));
            newBall(60, 107, 2, 1, 0.0000000001, color(176, 79, 176));
        }
        background(199, 229, 255); // Light blue background.
        textSize(48);
        fill(255); // White text.
        text("Dodgeball", 93, 100); // Game title.
        page = button(page, "inc", 1, 158, 135, 83, 32, "Play", color(252, 229, 252), 0); // "Play" button.

    } else if (page === 1) {
        // Settings page: allow players to configure HP and ball durability.
        balls = []; // Clear any balls.
        background(207, 253, 255); // Light background color.
        page = button(page, "inc", -1, 25, 356, 90, 32, "Back", color(255, 181, 255), 0); // "Back" button.
        page = button(page, "inc", 1, 294, 356, 90, 32, "Next", color(181, 185, 255), 0); // "Next" button.

        // Display HP settings.
        fill(0); // Black text.
        text("# of HP (" + HP + ")", 40, 100);
        text("bounces (" + ballDurability + ")", 212, 100);
        HP = button(HP, "set", 1, 47, 122, 83, 32, "1 life", color(181, 240, 255), 0); // 1 HP button.
        HP = button(HP, "set", 3, 47, 173, 83, 32, "3 lives", color(125, 181, 255), 0); // 3 HP button.
        HP = button(HP, "set", 5, 47, 226, 83, 32, "5 lives", color(141, 144, 240), 0); // 5 HP button.

        // Display ball durability settings.
        ballDurability = button(ballDurability, "set", 3, 210, 122, 83, 32, "3 bounces", color(181, 255, 185), 44);
        ballDurability = button(ballDurability, "set", 6, 210, 173, 83, 32, "6 bounces", color(166, 255, 209), 44);
        ballDurability = button(ballDurability, "set", 10, 210, 226, 83, 32, "10 bounces", color(135, 255, 227), 55);

    } else if (page === 2) {
        // Instructions page: explain game controls and objective.
        background(219, 242, 255); // Light blue background.
        text("Controls:", 34, 38); // Section title.
        textSize(20);
        // Display Player 1 controls.
        text("Player one,\nWASD to move\nQ and E to \nrotate the barrel\nR to fire\nF to place blocks", 36, 72);
        // Display Player 2 controls.
        text("Player two,\nIJKL to move\nU and O to \nrotate the barrel\nP to fire\nH to place blocks", 219, 72);

        // Explain the objective of the game.
        text("Your goal is to eliminate the opponent\n by draining their health points using\n bullets! Use blocks to defend yourself\n and rotate the barrel to aim. Have fun!", 33, 238);

        // Navigation buttons.
        page = button(page, "inc", -1, 25, 318, 90, 32, "Back", color(255, 181, 255), 0); // "Back" button.
        page = button(page, "inc", 1, 294, 318, 90, 32, "Start", color(181, 185, 255), 0); // "Start" button.

    } else if (page === 3) {
        // Main gameplay page.
        background(255, 212, 255); // Pink background.

        if (players.length === 0) {
            // Initialize the players with default settings.
            newPlayer(50, 50, color(235, 64, 198), HP, "wasd", 0, 1500, 5, 3); // Player 1 (Pink).
            newPlayer(317, 318, color(123, 216, 242), HP, "ijkl", 0, 1500, 5, 3); // Player 2 (Blue).
        }

        // Spawn power-ups periodically.
        if (powerupTimer > 1000) {
            powerupTimer = 0; // Reset timer.
            newItem(random(100, 300), random(100, 300), itemTypeList[round(random(0, 2))]); // Spawn a random power-up.
        } else {
            powerupTimer++; // Increment timer.
        }

        // Draw boundaries for the play area.
        fill(0, 0, 0);
        rect(0, -6, 400, 50); // Top boundary.
        rect(-9, 0, 50, 360); // Left boundary.
        rect(356, 0, 50, 400); // Right boundary.
        rect(0, 356, 400, 50); // Bottom boundary.

        // Render and update all objects (players, blocks, balls, and items).
        checkAll(players, "square", 21);
        checkAll(blocks, "square", 20);
        checkAll(balls, "ellipse", 10);
        checkAll(items, "square", 15);

        // Update player logic.
        for (var i = 0; i < players.length; i++) {
            playerTick(players[i]);
        }

        // Update ball logic.
        for (var i = 0; i < balls.length; i++) {
            ballTick(balls[i]);
        }
        
        for (var i = 0; i < items.length; i++) {
            itemTick(items[i]);
        }
    }

    // Display the winner page if the game ends.
    if (page === "p1") {
        background(255, 186, 255); // Pink background for Player 1.
        textSize(25);
        text("Player 1 Wins!", 90, 161); // Display winner message.
    } else if (page === "p2") {
        background(160, 201, 255); // Blue background for Player 2.
        textSize(25);
        text("Player 2 Wins!", 90, 161); // Display winner message.
    }
};
