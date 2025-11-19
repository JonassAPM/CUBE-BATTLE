let selectedColor = 'green';
let playerName = 'JUGADOR';

const colorNames = {
    green: 'VERDE',
    blue: 'AZUL', 
    red: 'ROJO',
    purple: 'PÚRPURA',
    cyan: 'CIAN',
    yellow: 'AMARILLO',
    pink: 'ROSA',
    orange: 'NARANJA'
};

function selectColor(color) {
    selectedColor = color;
    
    document.querySelectorAll('.color-option-small').forEach(option => {
        option.classList.remove('selected');
    });
    
    document.querySelector(`.color-option-small[data-color="${color}"]`).classList.add('selected');
}

document.addEventListener('DOMContentLoaded', function() {
    const nameInput = document.getElementById('playerName');
    nameInput.addEventListener('input', function() {
        playerName = this.value.toUpperCase() || 'JUGADOR';
    });
    
    selectColor('green');
});

function showControlsScreen() {
    const configScreen = document.getElementById('configScreen');
    const controlsScreen = document.getElementById('controlsScreen');

    document.getElementById('previewPlayerName').textContent = playerName;
    document.getElementById('previewPlayerColor').textContent = colorNames[selectedColor];
    
    configScreen.classList.add('hidden');
    controlsScreen.classList.remove('hidden');
}

function showConfigScreen() {
    const configScreen = document.getElementById('configScreen');
    const controlsScreen = document.getElementById('controlsScreen');
    
    controlsScreen.classList.add('hidden');
    configScreen.classList.remove('hidden');
}

function startGame() {
    const controlsScreen = document.getElementById('controlsScreen');
    const gameContainer = document.getElementById('gameContainer');
    
    controlsScreen.classList.add('hidden');
    gameContainer.classList.remove('hidden');
    
    new CubeBattleGame();
}

class CubeBattleGame {
    constructor() {
        this.cube = document.getElementById('cube');
        this.positionDisplay = document.getElementById('position');
        this.bulletCountDisplay = document.getElementById('bulletCount');
        this.chargeLevelDisplay = document.getElementById('chargeLevel');
        this.playerNameDisplay = document.getElementById('playerNameDisplay');
        this.bulletsContainer = document.getElementById('bulletsContainer');
        this.chargingBullet = document.getElementById('chargingBullet');
        this.gameContainer = document.getElementById('gameContainer');
        this.shootArea = document.getElementById('shootArea');
        
        this.healthBar = document.getElementById('healthBar');
        this.healthText = document.getElementById('healthText');
        this.chargeBar = document.getElementById('chargeBar');
        
        this.position = {
            x: window.innerWidth / 2 - 30,
            y: window.innerHeight / 2 - 30
        };
        
        this.speed = 12;
        this.cubeSize = 60;
        this.tilt = 0;
        this.velocity = { x: 0, y: 0 };
        this.bullets = [];
        this.bulletCount = 0;
        
        this.maxAmmo = 10;
        this.currentAmmo = this.maxAmmo;
        this.lastAmmoRecharge = Date.now();
        this.ammoRechargeRate = 1000;

        this.isCharging = false;
        this.chargeStartTime = 0;
        this.chargeLevel = 0;
        this.maxChargeTime = 3000;
        this.chargeBullets = 0;

        this.maxHealth = 10;
        this.currentHealth = this.maxHealth;

        this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        this.touchStartTime = 0;
        this.touchTimeout = null;
        this.isTouchCharging = false;
        this.lastTouchTime = 0;

        this.joystickActive = false;
        this.joystickHandle = null;
        this.joystickBase = null;
        this.joystickStartX = 0;
        this.joystickStartY = 0;
        this.joystickMaxDistance = 0;
        this.joystickDirection = { x: 0, y: 0 };

        this.keys = {
            w: false,
            a: false,
            s: false,
            d: false,
            ArrowUp: false,
            ArrowLeft: false,
            ArrowDown: false,
            ArrowRight: false,
            ' ': false,
            Enter: false
        };
        
        this.applySelectedColor();
        this.updatePlayerName();
        this.init();

        this.applySelectedColor();
        this.updatePlayerName();
        this.init();
    }
    
    updatePlayerName() {
        this.playerNameDisplay.textContent = playerName;
    }
    
    applySelectedColor() {
        const cubeFaces = document.querySelectorAll('.cube-face');
        const coreGlow = document.querySelector('.core-glow');
        const ammoBars = document.querySelectorAll('.ammo-bar');
        
        const colorMap = {
            green: { main: '#00ff41', light: 'rgba(0, 255, 65, 0.15)' },
            blue: { main: '#0066ff', light: 'rgba(0, 102, 255, 0.15)' },
            red: { main: '#ff0033', light: 'rgba(255, 0, 51, 0.15)' },
            purple: { main: '#cc00ff', light: 'rgba(204, 0, 255, 0.15)' },
            cyan: { main: '#00ffff', light: 'rgba(0, 255, 255, 0.15)' },
            yellow: { main: '#ffff00', light: 'rgba(255, 255, 0, 0.15)' },
            pink: { main: '#ff00ff', light: 'rgba(255, 0, 255, 0.15)' },
            orange: { main: '#ff6600', light: 'rgba(255, 102, 0, 0.15)' }
        };
        
        const color = colorMap[selectedColor];
        
        cubeFaces.forEach(face => {
            face.style.borderColor = color.main;
            face.style.background = color.light;
            face.style.boxShadow = `inset 0 0 20px ${color.main}, 0 0 20px ${color.main}`;
        });
        
        coreGlow.style.background = color.main;
        coreGlow.style.boxShadow = `0 0 30px ${color.main}, 0 0 60px ${color.main}`;
        
        ammoBars.forEach(bar => {
            bar.style.background = color.main;
            bar.style.borderColor = color.main;
            bar.style.boxShadow = `0 0 10px ${color.main}`;
        });
        
        this.gameContainer.className = 'game-container ' + selectedColor + '-bg';
    }
    
    init() {
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        window.addEventListener('resize', () => this.handleResize());
        
        if (this.isTouchDevice) {
            this.initTouchControls();
            this.initJoystick();
        }
        
        this.gameLoop();
        this.updateDisplays();
    }

    initJoystick() {
        this.joystickHandle = document.getElementById('joystickHandle');
        this.joystickBase = document.querySelector('.joystick-base');
        
        if (!this.joystickHandle || !this.joystickBase) return;
        
        const baseRect = this.joystickBase.getBoundingClientRect();
        this.joystickStartX = baseRect.left + baseRect.width / 2;
        this.joystickStartY = baseRect.top + baseRect.height / 2;
        this.joystickMaxDistance = baseRect.width / 3;

        this.joystickHandle.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.joystickActive = true;
            this.joystickHandle.classList.add('active');
            this.updateJoystick(e.touches[0]);
        });
        
        document.addEventListener('touchmove', (e) => {
            if (this.joystickActive) {
                e.preventDefault();
                this.updateJoystick(e.touches[0]);
            }
        });
        
        document.addEventListener('touchend', (e) => {
            if (this.joystickActive) {
                e.preventDefault();
                this.resetJoystick();
            }
        });
        
        document.addEventListener('touchcancel', (e) => {
            if (this.joystickActive) {
                e.preventDefault();
                this.resetJoystick();
            }
        });

        this.joystickHandle.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.joystickActive = true;
            this.joystickHandle.classList.add('active');
            this.updateJoystick(e);
        });
        
        document.addEventListener('mousemove', (e) => {
            if (this.joystickActive) {
                e.preventDefault();
                this.updateJoystick(e);
            }
        });
        
        document.addEventListener('mouseup', (e) => {
            if (this.joystickActive) {
                e.preventDefault();
                this.resetJoystick();
            }
        });
    }

    updateJoystick(touch) {
        if (!this.joystickActive) return;
        
        const currentX = touch.clientX;
        const currentY = touch.clientY;
        const deltaX = currentX - this.joystickStartX;
        const deltaY = currentY - this.joystickStartY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const limitedDistance = Math.min(distance, this.joystickMaxDistance);
        const angle = Math.atan2(deltaY, deltaX);
        const limitedX = Math.cos(angle) * limitedDistance;
        const limitedY = Math.sin(angle) * limitedDistance;

        this.joystickHandle.style.transform = `translate(${limitedX}px, ${limitedY}px)`;
        this.joystickDirection.x = limitedX / this.joystickMaxDistance;
        this.joystickDirection.y = limitedY / this.joystickMaxDistance;
    }
    
    resetJoystick() {
        this.joystickActive = false;
        this.joystickDirection.x = 0;
        this.joystickDirection.y = 0;
        this.joystickHandle.style.transform = 'translate(0, 0)';
        this.joystickHandle.classList.remove('active');
    }
    
    initTouchControls() {
        const touchTarget = this.gameContainer; 
        let chargeStartedOnTouch = false;
        let touchID = null;

        const handleTouchStart = (e) => {
            e.preventDefault();

            if (e.touches.length > 1 || touchID !== null) return;

            touchID = e.touches[0].identifier;

            if (this.touchTimeout) {
                clearTimeout(this.touchTimeout);
                this.touchTimeout = null;
            }

            const touchY = e.touches[0].clientY;
            const hudHeight = 80;

            if (touchY < window.innerHeight - hudHeight && this.currentAmmo > 0 && !this.isCharging) {
                this.startCharging();
                chargeStartedOnTouch = true;
                this.touchStartTime = Date.now();
                this.isTouchCharging = true;

                this.touchTimeout = setTimeout(() => {
                    this.touchTimeout = null;
                }, 150);
            } else {
                chargeStartedOnTouch = false;
            }
        };

        const handleTouchEnd = (e) => {
            e.preventDefault();

            let isChargeEnding = false;
            for (let i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === touchID) {
                    isChargeEnding = true;
                    break;
                }
            }

            if (!isChargeEnding) return;

            this.isTouchCharging = false;
            touchID = null;

            if (this.touchTimeout) {
                clearTimeout(this.touchTimeout);
                this.touchTimeout = null;
                
                if (this.isCharging && chargeStartedOnTouch) {
                    this.shootCharged(); 
                }
            } else if (this.isCharging && chargeStartedOnTouch) {
                this.shootCharged();
            }
            
            chargeStartedOnTouch = false;
        };

        touchTarget.addEventListener('touchstart', handleTouchStart);
        touchTarget.addEventListener('touchend', handleTouchEnd);
        touchTarget.addEventListener('touchcancel', handleTouchEnd);
        touchTarget.addEventListener('touchmove', (e) => e.preventDefault());

        if (this.shootArea) {
            this.shootArea.addEventListener('touchstart', (e) => {
                e.stopPropagation();
                if (this.currentAmmo > 0 && !this.isCharging) {
                    this.startCharging();
                    this.touchStartTime = Date.now();
                    this.isTouchCharging = true;
                }
            });

            this.shootArea.addEventListener('touchend', (e) => {
                e.stopPropagation();
                this.isTouchCharging = false;

                if (this.isCharging) {
                    this.shootCharged();
                }
            });
        }
    }
    
    handleKeyDown(event) {
        if (this.keys.hasOwnProperty(event.key)) {
            this.keys[event.key] = true;

            if ((event.key === ' ' || event.key === 'Enter') && this.currentAmmo > 0 && !this.isCharging) {
                event.preventDefault();
                this.startCharging();
            }
        }
    }
    
    handleKeyUp(event) {
        if (this.keys.hasOwnProperty(event.key)) {
            if ((event.key === ' ' || event.key === 'Enter') && this.isCharging) {
                this.shootCharged();
            }
            this.keys[event.key] = false;
        }
    }
    
    moveCube() {
        this.velocity.x = 0;
        this.velocity.y = 0;
        this.tilt = 0;

        let keyboardActive = false;
        
        if (this.keys.a || this.keys.ArrowLeft) {
            this.velocity.x = -this.speed;
            this.tilt = -3;
            keyboardActive = true;
        } else if (this.keys.d || this.keys.ArrowRight) {
            this.velocity.x = this.speed;
            this.tilt = 3;
            keyboardActive = true;
        }
        
        if (this.keys.w || this.keys.ArrowUp) {
            this.velocity.y = -this.speed;
            keyboardActive = true;
        } else if (this.keys.s || this.keys.ArrowDown) {
            this.velocity.y = this.speed;
            keyboardActive = true;
        }
        
        if (!keyboardActive && this.joystickActive && this.isTouchDevice) {
            this.velocity.x = this.joystickDirection.x * this.speed;
            this.velocity.y = this.joystickDirection.y * this.speed;
            
            if (Math.abs(this.joystickDirection.x) > 0.1) {
                this.tilt = this.joystickDirection.x * 10;
            }
        }

        const newX = this.position.x + this.velocity.x;
        const newY = this.position.y + this.velocity.y;
        
        this.position.x = Math.max(0, Math.min(newX, window.innerWidth - this.cubeSize));
        this.position.y = Math.max(0, Math.min(newY, window.innerHeight - this.cubeSize));
    }
    
    startCharging() {
        this.isCharging = true;
        this.chargeStartTime = Date.now();
        this.chargeBullets = 1;
        
        this.cube.classList.add('vibrate-1');
        document.querySelector('.charge-effect').classList.add('active');
        
        this.chargingBullet.classList.remove('hidden');
        this.updateChargingBullet();
    }
    
    updateCharging() {
        if (!this.isCharging) return;
        
        const currentTime = Date.now();
        const chargeTime = currentTime - this.chargeStartTime;
        
        this.chargeLevel = Math.min(100, (chargeTime / this.maxChargeTime) * 100);
        
        this.chargeBullets = Math.min(10, Math.max(1, Math.floor(this.chargeLevel / 10) + 1));
        
        this.updateVibration();
        
        this.updateChargingBullet();
        
        const bulletsToConsume = this.chargeBullets;
        if (bulletsToConsume > this.currentAmmo) {
            this.chargeBullets = this.currentAmmo;
        }
    }
    
    updateVibration() {
        this.cube.classList.remove('vibrate-1', 'vibrate-2', 'vibrate-3', 'vibrate-4');
        if (this.chargeLevel >= 75) {
            this.cube.classList.add('vibrate-4');
        } else if (this.chargeLevel >= 50) {
            this.cube.classList.add('vibrate-3');
        } else if (this.chargeLevel >= 25) {
            this.cube.classList.add('vibrate-2');
        } else {
            this.cube.classList.add('vibrate-1');
        }
    }
    
    updateChargingBullet() {
        if (!this.isCharging) return;
        
        const baseSize = 20;
        const extraSize = (this.chargeBullets - 1) * 8;
        const bulletSize = baseSize + extraSize;
        
        const bulletX = this.position.x + this.cubeSize / 2 - bulletSize / 2;
        const bulletY = this.position.y - bulletSize - 5;
        
        this.chargingBullet.style.width = bulletSize + 'px';
        this.chargingBullet.style.height = bulletSize + 'px';
        this.chargingBullet.style.left = bulletX + 'px';
        this.chargingBullet.style.top = bulletY + 'px';
        this.chargingBullet.style.opacity = (this.chargeLevel / 100) * 0.8 + 0.2;
        this.chargingBullet.style.borderRadius = this.getBulletRoundness() + 'px';
        
        this.updateSpinAnimation();
    }
    
    getBulletRoundness() {
        return Math.max(2, 8 - (this.chargeLevel / 100) * 6);
    }
    
    updateSpinAnimation() {
        this.chargingBullet.classList.remove('spin-fast', 'spin-very-fast', 'spin-extreme');
        
        if (this.chargeLevel >= 80) {
            this.chargingBullet.classList.add('spin-extreme');
        } else if (this.chargeLevel >= 60) {
            this.chargingBullet.classList.add('spin-very-fast');
        } else if (this.chargeLevel >= 30) {
            this.chargingBullet.classList.add('spin-fast');
        }
    }
    
    shootCharged() {
        if (!this.isCharging || this.chargeBullets === 0) return;

        if (this.chargeBullets >= 6) {
            this.applyRecoil();
        }

        this.currentAmmo -= this.chargeBullets;

        if (this.chargeBullets === 1) {
            this.createNormalBullet();
        } else {
            this.createMegaBullet(this.chargeBullets);
        }

        this.stopCharging();
    }
    
    createNormalBullet() {
        const bulletSpeed = 15;
        const bulletSize = 20;
        
        const startX = this.position.x + this.cubeSize / 2 - bulletSize / 2;
        const startY = this.position.y - bulletSize;
        
        const bulletVelocity = {
            x: 0,
            y: -bulletSpeed
        };
        
        const bullet = {
            id: this.bulletCount++,
            x: startX,
            y: startY,
            size: bulletSize,
            velocity: bulletVelocity,
            element: null,
            creationTime: Date.now(),
            maxLifeTime: 2000,
            isMega: false,
            bulletCount: 1
        };
        
        const bulletElement = document.createElement('div');
        bulletElement.className = 'bullet';
        bulletElement.style.width = bullet.size + 'px';
        bulletElement.style.height = bullet.size + 'px';
        bulletElement.style.left = bullet.x + 'px';
        bulletElement.style.top = bullet.y + 'px';
        
        this.bulletsContainer.appendChild(bulletElement);
        bullet.element = bulletElement;
        
        this.bullets.push(bullet);
    }

    createMegaBullet(bulletCount) {
        const baseSpeed = 15;
        const speedMultiplier = bulletCount >= 6 ? 3 : 1.5;
        const speedBoost = Math.min(10, (bulletCount - 1) * 2);
        const bulletSpeed = (baseSpeed + speedBoost) * speedMultiplier;
        
        const baseSize = 20;
        const sizeBoost = (bulletCount - 1) * 8;
        const bulletSize = baseSize + sizeBoost;
        
        const startX = this.position.x + this.cubeSize / 2 - bulletSize / 2;
        const startY = this.position.y - bulletSize;
        
        const bulletVelocity = {
            x: 0,
            y: -bulletSpeed
        };
        
        const bullet = {
            id: this.bulletCount++,
            x: startX,
            y: startY,
            size: bulletSize,
            velocity: bulletVelocity,
            element: null,
            creationTime: Date.now(),
            maxLifeTime: bulletCount >= 6 ? 1500 + (bulletCount * 300) : 2000 + (bulletCount * 500),
            isMega: true,
            bulletCount: bulletCount,
            rotation: 0,
            rotationSpeed: Math.min(20, bulletCount * 2),
            isSuperSonic: bulletCount >= 6
        };
        
        const bulletElement = document.createElement('div');
        bulletElement.className = 'bullet';
        bulletElement.classList.add('mega');
        
        if (bullet.isSuperSonic) {
            bulletElement.classList.add('super-sonic');
        }
        
        bulletElement.style.width = bullet.size + 'px';
        bulletElement.style.height = bullet.size + 'px';
        bulletElement.style.left = bullet.x + 'px';
        bulletElement.style.top = bullet.y + 'px';
        bulletElement.style.borderRadius = this.getMegaBulletRoundness(bulletCount) + 'px';
        
        if (bullet.isSuperSonic) {
            const glowIntensity = Math.min(4, bulletCount / 2);
            bulletElement.style.boxShadow = 
                `0 0 ${25 * glowIntensity}px #ffffff,
                 0 0 ${50 * glowIntensity}px #ff0000,
                 0 0 ${75 * glowIntensity}px #ffff00`;
        } else {
            const glowIntensity = Math.min(2, bulletCount / 3);
            bulletElement.style.boxShadow = 
                `0 0 ${20 * glowIntensity}px #ffffff,
                 0 0 ${40 * glowIntensity}px #00ffff,
                 0 0 ${60 * glowIntensity}px #ff00ff`;
        }
        
        this.bulletsContainer.appendChild(bulletElement);
        bullet.element = bulletElement;
        
        this.bullets.push(bullet);
    }
    
    applyRecoil() {
        this.cube.classList.add('recoil');
        
        const recoilForce = Math.min(20, this.chargeBullets * 3);
        this.position.y += recoilForce;
        
        this.position.y = Math.max(0, Math.min(this.position.y, window.innerHeight - this.cubeSize));
        
        setTimeout(() => {
            this.cube.classList.remove('recoil');
        }, 200);
    }
    
    stopCharging() {
        this.isCharging = false;
        this.chargeLevel = 0;
        this.chargeBullets = 0;
        
        this.cube.classList.remove('vibrate-1', 'vibrate-2', 'vibrate-3', 'vibrate-4');
        document.querySelector('.charge-effect').classList.remove('active');
        this.chargingBullet.classList.add('hidden');
        this.chargingBullet.classList.remove('spin-fast', 'spin-very-fast', 'spin-extreme');
    }
    
    getMegaBulletRoundness(bulletCount) {
        return Math.max(2, 8 - (bulletCount - 1));
    }
    
    handleResize() {
        this.position.x = Math.max(0, Math.min(this.position.x, window.innerWidth - this.cubeSize));
        this.position.y = Math.max(0, Math.min(this.position.y, window.innerHeight - this.cubeSize));
    }
    
    rechargeAmmo() {
        const currentTime = Date.now();
        if (currentTime - this.lastAmmoRecharge >= this.ammoRechargeRate) {
            if (this.currentAmmo < this.maxAmmo) {
                this.currentAmmo++;
                this.lastAmmoRecharge = currentTime;
            }
        }
    }
    
    updateAmmoBars() {
        const ammoBars = document.querySelectorAll('.ammo-bar');
        const fillHeight = (this.currentAmmo / this.maxAmmo) * 40;
        
        ammoBars.forEach(bar => {
            bar.style.background = `linear-gradient(to top, ${this.getAmmoColor()} ${fillHeight}px, transparent ${fillHeight}px)`;
        });
    }
    
    getAmmoColor() {
        const colorMap = {
            green: '#00ff41',
            blue: '#0066ff',
            red: '#ff0033',
            purple: '#cc00ff',
            cyan: '#00ffff',
            yellow: '#ffff00',
            pink: '#ff00ff',
            orange: '#ff6600'
        };
        return colorMap[selectedColor];
    }
    
    updateBullets() {
        const currentTime = Date.now();
        
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            
            bullet.x += bullet.velocity.x;
            bullet.y += bullet.velocity.y;
            
            if (bullet.isMega) {
                bullet.rotation += bullet.rotationSpeed;
                bullet.element.style.transform = `rotate(${bullet.rotation}deg)`;
            }
            
            bullet.element.style.left = bullet.x + 'px';
            bullet.element.style.top = bullet.y + 'px';
            
            const isOutOfBounds = 
                bullet.x < -bullet.size || 
                bullet.x > window.innerWidth || 
                bullet.y < -bullet.size || 
                bullet.y > window.innerHeight;
            
            const isExpired = currentTime - bullet.creationTime > bullet.maxLifeTime;
            
            if (isOutOfBounds || isExpired) {
                bullet.element.remove();
                this.bullets.splice(i, 1);
            }
        }
    }
    
    updateCubePosition() {
        this.cube.style.left = this.position.x + 'px';
        this.cube.style.top = this.position.y + 'px';
        
        if (!this.isCharging && !this.cube.classList.contains('recoil')) {
            this.cube.style.transform = `rotateZ(${this.tilt}deg)`;
        }
    }
    
    updateHealthDisplay() {
        const healthPercent = (this.currentHealth / this.maxHealth) * 100;
        this.healthBar.style.width = `${healthPercent}%`;
        this.healthText.textContent = `${this.currentHealth}/${this.maxHealth}`;
        
        if (healthPercent <= 25) {
            this.healthBar.style.background = 'linear-gradient(90deg, #ff0000, #ff6600)';
        } else if (healthPercent <= 50) {
            this.healthBar.style.background = 'linear-gradient(90deg, #ffff00, #ff6600)';
        } else {
            this.healthBar.style.background = 'linear-gradient(90deg, #00ff41, #00ffff)';
        }
    }
    
    updateDisplays() {
        this.positionDisplay.textContent = `X:${Math.round(this.position.x)} Y:${Math.round(this.position.y)}`;
        
        this.bulletCountDisplay.textContent = `${this.currentAmmo}/${this.maxAmmo}`;
        
        this.chargeLevelDisplay.textContent = `${Math.round(this.chargeLevel)}%`;
        this.chargeBar.style.width = `${this.chargeLevel}%`;
        
        this.updateHealthDisplay();
        
        if (this.currentAmmo === 0) {
            this.bulletCountDisplay.style.color = '#ff0033';
        } else if (this.currentAmmo <= 3) {
            this.bulletCountDisplay.style.color = '#ffff00';
        } else {
            this.bulletCountDisplay.style.color = this.getAmmoColor();
        }
        
        if (this.chargeLevel >= 75) {
            this.chargeLevelDisplay.style.color = '#ff00ff';
            this.chargeBar.style.background = 'linear-gradient(90deg, #ff00ff, #ff0000)';
        } else if (this.chargeLevel >= 50) {
            this.chargeLevelDisplay.style.color = '#ffff00';
            this.chargeBar.style.background = 'linear-gradient(90deg, #ffff00, #ff00ff)';
        } else if (this.chargeLevel >= 25) {
            this.chargeLevelDisplay.style.color = '#00ffff';
            this.chargeBar.style.background = 'linear-gradient(90deg, #00ffff, #ffff00)';
        } else {
            this.chargeLevelDisplay.style.color = this.getAmmoColor();
            this.chargeBar.style.background = 'linear-gradient(90deg, #00ffff, #ff00ff)';
        }
        
        this.updateAmmoBars();
    }
    
    gameLoop() {
        this.moveCube();
        this.rechargeAmmo();
        
        if (this.isCharging) {
            this.updateCharging();
            this.updateChargingBullet();
        }
        
        this.updateBullets();
        this.updateCubePosition();
        this.updateDisplays();
        
        requestAnimationFrame(() => this.gameLoop());
    }
}

class FullscreenManager {
    constructor() {
        this.fullscreenBtn = document.getElementById('fullscreenBtn');
        this.fullscreenIcon = this.fullscreenBtn?.querySelector('.fullscreen-icon');
        this.isFullscreen = false;
        
        if (this.fullscreenBtn) {
            this.init();
        }
    }
    
    init() {
        this.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
        document.addEventListener('fullscreenchange', () => this.handleFullscreenChange());
        document.addEventListener('webkitfullscreenchange', () => this.handleFullscreenChange());
        document.addEventListener('mozfullscreenchange', () => this.handleFullscreenChange());
        document.addEventListener('MSFullscreenChange', () => this.handleFullscreenChange());
    }
    
    toggleFullscreen() {
        if (!this.isFullscreen) {
            this.enterFullscreen();
        } else {
            this.exitFullscreen();
        }
    }
    
    enterFullscreen() {
        const element = document.documentElement;
        
        if (element.requestFullscreen) {
            element.requestFullscreen();
        } else if (element.webkitRequestFullscreen) {
            element.webkitRequestFullscreen();
        } else if (element.mozRequestFullScreen) {
            element.mozRequestFullScreen();
        } else if (element.msRequestFullscreen) {
            element.msRequestFullscreen();
        }
    }
    
    exitFullscreen() {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }
    
    handleFullscreenChange() {
        this.isFullscreen = !!(
            document.fullscreenElement ||
            document.webkitFullscreenElement ||
            document.mozFullScreenElement ||
            document.msFullscreenElement
        );
        
        this.updateButton();
    }
    
    updateButton() {
        if (this.isFullscreen) {
            this.fullscreenBtn.classList.add('fullscreen-active');
            this.fullscreenIcon.textContent = '⛶';
            this.fullscreenBtn.title = 'Salir de Pantalla Completa';
        } else {
            this.fullscreenBtn.classList.remove('fullscreen-active');
            this.fullscreenIcon.textContent = '⛶';
            this.fullscreenBtn.title = 'Pantalla Completa';
        }
    }
}

class RotationManager {
    constructor() {
        this.rotateAlert = document.getElementById('rotateAlert');
        this.checkRotation();
        
        window.addEventListener('resize', () => this.checkRotation());
        window.addEventListener('orientationchange', () => this.checkRotation());
    }
    
    checkRotation() {
        const isVertical = window.innerHeight > window.innerWidth;
        
        if (isVertical) {
            this.showRotationAlert();
        } else {
            this.hideRotationAlert();
        }
    }
    
    showRotationAlert() {
        if (this.rotateAlert) {
            this.rotateAlert.style.display = 'flex';
        }
    }
    
    hideRotationAlert() {
        if (this.rotateAlert) {
            this.rotateAlert.style.display = 'none';
        }
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const fullscreenManager = new FullscreenManager();
    new RotationManager();
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            fullscreenManager.toggleFullscreen(); 
        });
    }

    setTimeout(() => {
        new RotationManager().checkRotation();
    }, 100);
});

document.addEventListener('DOMContentLoaded', function() {
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && (e.key === '+' || e.key === '-' || e.key === '=')) {
            e.preventDefault();
        }
    });
    document.addEventListener('wheel', function(e) {
        if (e.ctrlKey) {
            e.preventDefault();
        }
    }, { passive: false });

    document.addEventListener('gesturestart', function(e) {
        e.preventDefault();
    });
    document.addEventListener('gesturechange', function(e) {
        e.preventDefault();
    });
    document.addEventListener('gestureend', function(e) {
        e.preventDefault();
    });
});