// VARIABLES GLOBALES
let selectedColor = 'green';
let playerName = 'JUGADOR';
let controlMode = 'auto';
let isMobileDevice = false;

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

// DETECCIÓN DE DISPOSITIVO
function detectDevice() {
    const userAgent = navigator.userAgent.toLowerCase();
    isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    console.log('Dispositivo detectado:', isMobileDevice ? 'Móvil' : 'PC');
    return isMobileDevice;
}

function selectColor(color) {
    selectedColor = color;
    
    document.querySelectorAll('.color-option-small').forEach(option => {
        option.classList.remove('selected');
    });
    
    document.querySelector(`.color-option-small[data-color="${color}"]`).classList.add('selected');
}

// INICIALIZACIÓN
document.addEventListener('DOMContentLoaded', function() {
    const nameInput = document.getElementById('playerName');
    nameInput.addEventListener('input', function() {
        playerName = this.value.toUpperCase() || 'JUGADOR';
    });
    
    selectColor('green');
    detectDevice();
    
    // Mostrar pantalla de selección de controles
    showControlSelectScreen();
});

// PANTALLAS
function showControlSelectScreen() {
    const rotateAlert = document.getElementById('rotateAlert');
    const controlSelectScreen = document.getElementById('controlSelectScreen');
    
    rotateAlert.classList.add('hidden');
    controlSelectScreen.classList.remove('hidden');
}

function selectControlMode(mode) {
    controlMode = mode;
    console.log('Modo seleccionado:', mode);
    
    const controlSelectScreen = document.getElementById('controlSelectScreen');
    const configScreen = document.getElementById('configScreen');
    
    controlSelectScreen.classList.add('hidden');
    configScreen.classList.remove('hidden');
}

function autoDetectControls() {
    if (isMobileDevice) {
        selectControlMode('mobile');
    } else {
        selectControlMode('pc');
    }
}

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

// CLASE JOYSTICK VIRTUAL COMPLETAMENTE CORREGIDA
class VirtualJoystick {
    constructor(handleElement, baseElement, onDirectionChange) {
        this.handle = handleElement;
        this.base = baseElement;
        this.onDirectionChange = onDirectionChange;
        this.active = false;
        this.direction = { x: 0, y: 0 };
        this.baseRect = null;
        this.maxDistance = 0;
        this.currentTouchId = null;
        
        this.init();
    }
    
    init() {
        if (!this.handle || !this.base) {
            console.error('❌ Elementos del joystick no encontrados');
            return;
        }

        console.log('🎮 Inicializando joystick...');
        
        // Eventos táctiles
        this.base.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        document.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        document.addEventListener('touchend', (e) => this.handleTouchEnd(e));
        document.addEventListener('touchcancel', (e) => this.handleTouchEnd(e));
        
        // Eventos de mouse para desarrollo
        this.base.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        document.addEventListener('mouseup', (e) => this.handleMouseUp(e));

        // Actualizar dimensiones
        this.updateDimensions();
        window.addEventListener('resize', () => this.updateDimensions());
        
        console.log('✅ Joystick inicializado');
    }

    updateDimensions() {
        this.baseRect = this.base.getBoundingClientRect();
        this.maxDistance = this.baseRect.width * 0.4;
        console.log('📐 Dimensiones actualizadas:', this.baseRect, 'Max distance:', this.maxDistance);
    }

    handleTouchStart(e) {
        e.preventDefault();
        if (this.active) return;
        
        const touch = e.touches[0];
        this.currentTouchId = touch.identifier;
        this.activate(touch.clientX, touch.clientY);
    }

    handleTouchMove(e) {
        if (!this.active) return;
        
        e.preventDefault();
        const touch = Array.from(e.touches).find(t => t.identifier === this.currentTouchId);
        if (touch) {
            this.update(touch.clientX, touch.clientY);
        }
    }

    handleTouchEnd(e) {
        if (!this.active) return;
        
        e.preventDefault();
        const touch = Array.from(e.changedTouches).find(t => t.identifier === this.currentTouchId);
        if (touch) {
            this.deactivate();
        }
    }

    handleMouseDown(e) {
        e.preventDefault();
        if (this.active) return;
        
        this.activate(e.clientX, e.clientY);
    }

    handleMouseMove(e) {
        if (!this.active) return;
        
        e.preventDefault();
        this.update(e.clientX, e.clientY);
    }

    handleMouseUp(e) {
        if (!this.active) return;
        
        e.preventDefault();
        this.deactivate();
    }

    activate(clientX, clientY) {
        this.active = true;
        this.handle.classList.add('active');
        this.updateDimensions();
        this.update(clientX, clientY);
        console.log('🎯 Joystick activado');
    }

    deactivate() {
        this.active = false;
        this.direction = { x: 0, y: 0 };
        this.currentTouchId = null;
        this.handle.style.transform = 'translate(0, 0)';
        this.handle.classList.remove('active');
        
        if (this.onDirectionChange) {
            this.onDirectionChange(this.direction);
        }
        
        console.log('🎯 Joystick desactivado');
    }

    update(clientX, clientY) {
        if (!this.active || !this.baseRect) return;

        const centerX = this.baseRect.left + this.baseRect.width / 2;
        const centerY = this.baseRect.top + this.baseRect.height / 2;
        
        const deltaX = clientX - centerX;
        const deltaY = clientY - centerY;
        
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const limitedDistance = Math.min(distance, this.maxDistance);
        
        const angle = Math.atan2(deltaY, deltaX);
        const limitedX = Math.cos(angle) * limitedDistance;
        const limitedY = Math.sin(angle) * limitedDistance;
        
        // Actualizar posición visual del handle
        this.handle.style.transform = `translate(${limitedX}px, ${limitedY}px)`;
        
        // Calcular dirección normalizada (-1 a 1)
        this.direction.x = limitedX / this.maxDistance;
        this.direction.y = limitedY / this.maxDistance;
        
        console.log('🎮 Joystick direction:', this.direction);
        
        // Llamar callback si existe
        if (this.onDirectionChange) {
            this.onDirectionChange(this.direction);
        }
    }
    
    getDirection() {
        return this.direction;
    }
    
    isActive() {
        return this.active;
    }
}

// CLASE PRINCIPAL DEL JUEGO
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
        
        this.cubeSize = 60; // Tamaño base
        
        this.position = {
            x: window.innerWidth / 2 - 30,
            y: window.innerHeight / 2 - 30
        };
        
        // CÁLCULO DE VELOCIDAD DINÁMICA
        // Queremos cruzar el ancho en 3 segundos.
        // Asumiendo 60 FPS: 3 segundos * 60 frames = 180 frames totales.
        // Velocidad = Ancho Pantalla / 180.
        this.calculateSpeed();
        
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
        
        // JOYSTICK
        this.joystick = null;
        this.joystickDirection = { x: 0, y: 0 };
        this.usingMobileControls = controlMode === 'mobile';

        this.keys = {
            w: false, a: false, s: false, d: false,
            ArrowUp: false, ArrowLeft: false, ArrowDown: false, ArrowRight: false,
            ' ': false, Enter: false
        };
        
        this.applySelectedColor();
        this.updatePlayerName();
        this.init();
    }

    calculateSpeed() {
        // 3 segundos * 60 frames por segundo = 180 frames
        const TARGET_SECONDS = 3;
        const FPS = 60; 
        const totalFrames = TARGET_SECONDS * FPS;
        
        // La velocidad es cuántos píxeles moverse por frame
        this.speed = window.innerWidth / totalFrames;
        
        console.log(`⚡ Velocidad ajustada a: ${this.speed.toFixed(2)} px/frame para ancho ${window.innerWidth}px`);
    }

    startCharging() {
        this.isCharging = true;
        this.chargeStartTime = Date.now();
        this.chargeBullets = 1;
        
        this.cube.classList.add('vibrate-1');
        document.querySelector('.charge-effect').classList.add('active');
        
        this.chargingBullet.classList.remove('hidden');
        this.updateChargingBullet();
        
        // Actualizar estado visual del botón de disparo
        const shootButton = document.querySelector('.touch-shoot-button');
        if (shootButton) {
            shootButton.classList.add('charging');
        }
    }

    stopCharging() {
        this.isCharging = false;
        this.chargeLevel = 0;
        this.chargeBullets = 0;
        
        this.cube.classList.remove('vibrate-1', 'vibrate-2', 'vibrate-3', 'vibrate-4');
        document.querySelector('.charge-effect').classList.remove('active');
        this.chargingBullet.classList.add('hidden');
        this.chargingBullet.classList.remove('spin-fast', 'spin-very-fast', 'spin-extreme');
        
        // Quitar estado visual del botón de disparo
        const shootButton = document.querySelector('.touch-shoot-button');
        if (shootButton) {
            shootButton.classList.remove('charging');
        }
    }

    updateCharging() {
        if (!this.isCharging) return;
        
        const currentTime = Date.now();
        const chargeTime = currentTime - this.chargeStartTime;
        
        this.chargeLevel = Math.min(100, (chargeTime / this.maxChargeTime) * 100);
        
        this.chargeBullets = Math.min(10, Math.max(1, Math.floor(this.chargeLevel / 10) + 1));
        
        this.updateVibration();
        this.updateChargingBullet();
        
        // Actualizar indicador de carga en el botón
        const chargeIndicator = document.querySelector('.shoot-charge-indicator');
        if (chargeIndicator) {
            const degrees = (this.chargeLevel / 100) * 360;
            chargeIndicator.style.background = `conic-gradient(
                from 0deg,
                #ffff00 0%,
                #ff00ff ${degrees * 0.25}%,
                #ff0000 ${degrees * 0.5}%,
                #ffff00 ${degrees * 0.75}%,
                #ff00ff 100%
            )`;
        }
        
        const bulletsToConsume = this.chargeBullets;
        if (bulletsToConsume > this.currentAmmo) {
            this.chargeBullets = this.currentAmmo;
        }
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
        
        // INICIALIZAR JOYSTICK SI ESTAMOS EN MÓVIL
        if (this.usingMobileControls) {
            console.log('📱 Inicializando joystick para móvil...');
            this.initJoystick();
        } else {
            console.log('⌨️ Usando controles de teclado');
        }
        
        if (this.isTouchDevice) {
            this.initTouchControls();
        }
        
        this.gameLoop();
        this.updateDisplays();
    }
    
    initJoystick() {
        const handle = document.getElementById('joystickHandle');
        const base = document.querySelector('.joystick-base');
        
        console.log('🔧 Buscando elementos del joystick:', { 
            handle: !!handle, 
            base: !!base,
            handleElement: handle,
            baseElement: base
        });
        
        if (handle && base) {
            // Crear joystick con callback para cambios de dirección
            this.joystick = new VirtualJoystick(
                handle, 
                base, 
                (direction) => {
                    this.joystickDirection = direction;
                    console.log('🔄 Callback de dirección:', direction);
                }
            );
            console.log('✅ Joystick virtual inicializado correctamente');
        } else {
            console.error('❌ No se pudo inicializar el joystick: elementos no encontrados');
        }
    }
    
    initTouchControls() {
    if (this.shootArea) {
        let pressTimer = null;
        let isPressing = false;
        const HOLD_DELAY = 200;

        const handleInputStart = (e) => {
            if (e.cancelable) e.preventDefault();
            if (this.currentAmmo <= 0) return;

            isPressing = true;

            pressTimer = setTimeout(() => {
                if (isPressing) {
                    this.startCharging();
                }
            }, HOLD_DELAY);
        };

        const handleInputEnd = (e) => {
            if (e.cancelable) e.preventDefault();

            if (!isPressing) return;
            isPressing = false;

            if (pressTimer) {
                clearTimeout(pressTimer);
                pressTimer = null;
            }

            if (this.isCharging) {
                this.shootCharged();
            } else {
                if (this.currentAmmo > 0) {
                    this.createNormalBullet();
                    this.currentAmmo--;
                    this.updateDisplays();
                }
            }
        };

        this.shootArea.addEventListener('touchstart', handleInputStart, { passive: false });
        this.shootArea.addEventListener('touchend', handleInputEnd, { passive: false });
        
        this.shootArea.addEventListener('mousedown', handleInputStart);
        this.shootArea.addEventListener('mouseup', handleInputEnd);
        this.shootArea.addEventListener('mouseleave', (e) => {
            if (isPressing) handleInputEnd(e);
        });
    }

    const preventDefaultTouch = (e) => {
        if (e.target.closest('.touch-shoot-area') || 
            e.target.closest('.joystick-container')) {
        } else {
            e.preventDefault();
        }
    };
    
    this.gameContainer.addEventListener('touchstart', preventDefaultTouch, { passive: false });
    this.gameContainer.addEventListener('touchmove', preventDefaultTouch, { passive: false });
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
        
        // PRIORIDAD: Controles de teclado
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
        
        // SI NO HAY TECLADO ACTIVO Y ESTAMOS EN MÓVIL, USAR JOYSTICK
        if (!keyboardActive && this.usingMobileControls && this.joystick && this.joystick.isActive()) {
            const direction = this.joystickDirection;
            console.log('🎮 Moviendo con joystick:', direction);
            
            this.velocity.x = direction.x * this.speed;
            this.velocity.y = direction.y * this.speed;
            
            // Inclinación visual basada en dirección X
            if (Math.abs(direction.x) > 0.1) {
                this.tilt = direction.x * 15;
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
        
        // Recalcular velocidad al cambiar tamaño de pantalla
        this.calculateSpeed();
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
        
        // Calculamos el porcentaje exacto (0 a 100)
        const fillPercent = (this.currentAmmo / this.maxAmmo) * 100;
        
        ammoBars.forEach(bar => {
            // Usamos % en el gradiente para que se adapte a cualquier altura (vh) definida en CSS
            bar.style.background = `linear-gradient(to top, ${this.getAmmoColor()} ${fillPercent}%, transparent ${fillPercent}%)`;
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

// GESTOR DE PANTALLA COMPLETA
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

// GESTOR DE ROTACIÓN
class RotationManager {
    constructor() {
        this.rotateAlert = document.getElementById('rotateAlert');
        this.gameStarted = false;
        
        this.checkInitialRotation();
        window.addEventListener('orientationchange', () => this.handleOrientationChange());
    }

    checkInitialRotation() {
        const isVertical = window.innerHeight > window.innerWidth;
        
        if (isVertical) {
            this.showRotationAlert();
        } else {
            this.hideRotationAlert();
        }
    }

    handleOrientationChange() {
        if (this.gameStarted) return;
        
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

    setGameStarted() {
        this.gameStarted = true;
        this.hideRotationAlert();
    }
}

// FUNCIÓN START GAME CORREGIDA
function startGame() {
    const controlsScreen = document.getElementById('controlsScreen');
    const gameContainer = document.getElementById('gameContainer');
    
    controlsScreen.classList.add('hidden');
    gameContainer.classList.remove('hidden');
    
    console.log('🎮 Iniciando juego con modo:', controlMode);
    
    // LIMPIAR CLASES ANTERIORES
    gameContainer.classList.remove('show-joystick');
    
    // FORZAR JOYSTICK SI ES MÓVIL
    if (controlMode === 'mobile') {
        console.log('📱 ACTIVANDO JOYSTICK MANUALMENTE');
        gameContainer.classList.add('show-joystick');
        
        const joystick = document.getElementById('joystickContainer');
        const touchControls = document.getElementById('touchControls');
        
        if (joystick) {
            joystick.style.display = 'block';
            joystick.style.visibility = 'visible';
            joystick.style.opacity = '1';
            console.log('✅ Joystick forzado a visible');
        }
        
        if (touchControls) {
            touchControls.style.display = 'block';
            touchControls.style.visibility = 'visible';
            touchControls.style.opacity = '1';
            console.log('✅ Touch controls forzados a visible');
        }
    }
    
    // INDICAR QUE EL JUEGO INICIÓ
    if (window.rotationManager) {
        window.rotationManager.setGameStarted();
    }
    
    // INICIALIZAR EL JUEGO Y GUARDAR INSTANCIA
    window.gameInstance = new CubeBattleGame();
}

// INICIALIZACIÓN PRINCIPAL
document.addEventListener('DOMContentLoaded', function() {
    const fullscreenManager = new FullscreenManager();
    window.rotationManager = new RotationManager();
    
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            fullscreenManager.toggleFullscreen(); 
        });
    }

    // PREVENIR ZOOM Y GESTOS NO DESEADOS
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