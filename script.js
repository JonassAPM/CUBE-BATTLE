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
        
        this.speed = 8;
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

        this.gyroEnabled = false;
        this.gyroAlpha = 0;
        this.gyroBeta = 0;
        this.gyroGamma = 0;
        this.gyroSensitivity = 0.5;
        this.lastGyroUpdate = 0;
        this.gyroUpdateRate = 16;
        
        this.calibratedGamma = 0;
        this.calibratedBeta = 0;
        this.isCalibrated = false;

        this.smoothedBeta = 0;
        this.smoothedGamma = 0;
        this.smoothingFactor = 0.15;
        
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
        
        // Inicializar controles táctiles
        if (this.isTouchDevice) {
            this.initTouchControls();
        }
        
        // Inicializar giroscopio
        this.initGyroscope();
        
        this.gameLoop();
        this.updateDisplays();
    }
    
    initTouchControls() {
        // Disparo táctil en toda la pantalla (excepto HUD)
        this.gameContainer.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.touchStartTime = Date.now();
            this.isTouchCharging = true;
            this.lastTouchTime = Date.now();
            
            // Verificar que no se toque el HUD
            const touchY = e.touches[0].clientY;
            const hudHeight = 80; // Altura aproximada del HUD
            if (touchY < window.innerHeight - hudHeight && this.currentAmmo > 0 && !this.isCharging) {
                this.startCharging();
            }
            
            // Disparo rápido si se toca brevemente
            this.touchTimeout = setTimeout(() => {
                if (this.isTouchCharging && this.chargeLevel < 10) {
                    this.shootCharged();
                }
            }, 150);
        });
        
        this.gameContainer.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.isTouchCharging = false;
            
            if (this.touchTimeout) {
                clearTimeout(this.touchTimeout);
            }
            
            if (this.isCharging) {
                this.shootCharged();
            }
        });
        
        this.gameContainer.addEventListener('touchmove', (e) => {
            e.preventDefault();
        });
        
        // También mantener el botón de disparo como alternativa
        if (this.shootArea) {
            this.shootArea.addEventListener('touchstart', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.touchStartTime = Date.now();
                this.isTouchCharging = true;
                
                if (this.currentAmmo > 0 && !this.isCharging) {
                    this.startCharging();
                }
            });
            
            this.shootArea.addEventListener('touchend', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.isTouchCharging = false;
                
                if (this.isCharging) {
                    this.shootCharged();
                }
            });
        }
    }
    
    initGyroscope() {
        if (window.DeviceOrientationEvent) {
            window.addEventListener('deviceorientation', (e) => {
                const currentTime = Date.now();
                
                // Limitar la tasa de actualización para mejor rendimiento
                if (currentTime - this.lastGyroUpdate < this.gyroUpdateRate) {
                    return;
                }
                
                this.lastGyroUpdate = currentTime;
                
                // Obtener valores del giroscopio
                this.gyroAlpha = e.alpha || 0; // Rotación Z (0-360)
                this.gyroBeta = e.beta || 0;   // Inclinación X (-180 to 180)
                this.gyroGamma = e.gamma || 0; // Inclinación Y (-90 to 90)
                
                // Calibrar en la primera lectura
                if (!this.isCalibrated) {
                    this.calibratedGamma = this.gyroGamma;
                    this.calibratedBeta = this.gyroBeta;
                    this.isCalibrated = true;
                }
                
                this.gyroEnabled = true;
            });
            
            // Solicitar permiso para el giroscopio en dispositivos iOS
            if (typeof DeviceOrientationEvent.requestPermission === 'function') {
                const startButton = document.querySelector('.start-button');
                const originalOnClick = startButton.onclick;
                
                startButton.onclick = () => {
                    DeviceOrientationEvent.requestPermission()
                        .then(permissionState => {
                            if (permissionState === 'granted') {
                                this.gyroEnabled = true;
                                if (originalOnClick) {
                                    originalOnClick();
                                }
                            } else {
                                if (originalOnClick) {
                                    originalOnClick();
                                }
                            }
                        })
                        .catch(console.error);
                };
            }
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
    
    moveCube() {
        this.velocity.x = 0;
        this.velocity.y = 0;
        
        // Controles de teclado
        if (this.keys.a || this.keys.ArrowLeft) {
            this.velocity.x = -this.speed;
            this.tilt = -3;
        } else if (this.keys.d || this.keys.ArrowRight) {
            this.velocity.x = this.speed;
            this.tilt = 3;
        }
        
        if (this.keys.w || this.keys.ArrowUp) {
            this.velocity.y = -this.speed;
        }
        if (this.keys.s || this.keys.ArrowDown) {
            this.velocity.y = this.speed;
        }
        
        // Controles de giroscopio (si está disponible)
        if (this.gyroEnabled && this.isTouchDevice) {
            this.moveWithGyroscope();
        }
        
        const newX = this.position.x + this.velocity.x;
        const newY = this.position.y + this.velocity.y;
        
        this.position.x = Math.max(0, Math.min(newX, window.innerWidth - this.cubeSize));
        this.position.y = Math.max(0, Math.min(newY, window.innerHeight - this.cubeSize));
    }

    moveWithGyroscope() {
        if (!this.isCalibrated) return;

        const alpha = this.smoothingFactor;
        
        const rawAdjustedGamma = this.gyroGamma - this.calibratedGamma;
        const rawAdjustedBeta = this.gyroBeta - this.calibratedBeta;
        
        this.smoothedGamma = (this.smoothedGamma * (1 - alpha)) + (rawAdjustedGamma * alpha);
        this.smoothedBeta = (this.smoothedBeta * (1 - alpha)) + (rawAdjustedBeta * alpha);
        
        const adjustedGamma = this.smoothedGamma;
        const adjustedBeta = this.smoothedBeta;

        const deadZone = 1.5;
        
        this.velocity.x = 0;
        this.velocity.y = 0;

        if (Math.abs(adjustedGamma) > deadZone) {
            const movementLimit = 25; 
            const limitedGamma = Math.sign(adjustedGamma) * Math.min(Math.abs(adjustedGamma), movementLimit);

            this.velocity.x = (limitedGamma * this.gyroSensitivity); 
            this.tilt = limitedGamma > 0 ? 3 : -3;
        } else {
            this.tilt = 0;
        }

        if (Math.abs(adjustedBeta) > deadZone) {
            const movementLimit = 25;
            const limitedBeta = Math.sign(adjustedBeta) * Math.min(Math.abs(adjustedBeta), movementLimit);
            this.velocity.y = (-limitedBeta * this.gyroSensitivity); 
        }
        
        const maxSpeed = 15;
        this.velocity.x = Math.max(-maxSpeed, Math.min(maxSpeed, this.velocity.x));
        this.velocity.y = Math.max(-maxSpeed, Math.min(maxSpeed, this.velocity.y));
        

        if (Math.random() < 0.05) {
            console.log(`SmoothGamma: ${this.smoothedGamma.toFixed(1)}°, SmoothBeta: ${this.smoothedBeta.toFixed(1)}°, VelX: ${this.velocity.x.toFixed(1)}, VelY: ${this.velocity.y.toFixed(1)}`);
        }
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
    new RotationManager();
    new FullscreenManager();
    
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
