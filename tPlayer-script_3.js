var tPlayersCollection = [];

class tPlayerClass {
	constructor(options) {
		const initialSettings = {
			container: null,
			playlist: null,
			album: {
				artist: null,
				cover: null
			},
			skin: "default",
			rounded: false,
			showCover: true,
			showPlaylist: true,
			showRepeatButton: true,
			showShuffleButton: true,
			enableScroll: true,
			visibleTracks: 5,
			volume: 1,
			isRadio: false,
			pluginPath: null,
			updateRadioCovers: true,
			updateRadioInterval: 10000,
			style: {
				player: {
					background: "#FFF",
					cover: {
						background: "#3EC3D5",
						loader: "#FFF"
					},
					songtitle: "#555",
					buttons: {
						wave: "#3EC3D5",
						normal: "#555",
						hover: "#3EC3D5",
						active: "#3EC3D5",
					},
					seek: "#555",
					buffered: "rgba(255, 255, 255, 0.15)",
					progress: "#3EC3D5",
					timestamps: "#FFF",
					loader: {
						background: "#555",
						color: "#3EC3D5"
					},
					volume: {
						seek: "#555",
						value: "#3EC3D5"
					}
				},
				playlist: {
					scroll: {
						track: "rgba(255, 255, 255, 0.5)",
						thumb: "rgba(255, 255, 255, 0.75)"
					},
					background: "#3EC3D5",
					color: "#FFF",
					separator: "rgba(255, 255, 255, 0.25)",
					hover: {
						background: "#42CFE2",
						color: "#FFF",
						separator: "rgba(255, 255, 255, 0.25)",
					},
					active: {
						background: "#42CFE2",
						color: "#FFF",
						separator: "rgba(255, 255, 255, 0.25)",
					}
				}
			}
		};
		this.settings = this.utils.deepMerge(initialSettings, options);
		this.id = this.settings.container;
		this.playlist = this.settings.playlist;
		this.volume = this.settings.volume;
		this.elements = [];
		// States
		this.state = {
			autoplay: false,
			seeking: false,
			volumeSeeking: false,
			repeat: false,
			shuffle: false,
			togglePlaylist: false,
			volumeToggle: false,
			canUpdateRadioInfo: false,
			waitingRadioInfo: false,
			isMobile: this.utils.detectMobile(),
			scrollMouseLeaveTimeout: null
		};
		// Create Audio
		this.audio = new Audio();
		this.audio.preload = "metadata";
		this.audio.volume = 0;
		// Add to List of Players
		tPlayersCollection[this.id] = this.audio;

		this.currentSong = {
			index: 0,
			title: null,
			artist: null,
			cover: null
		};
		this.lastSongIndex = 0;

		console.log(this)
		this.init();
	}

	validatePlayerConfig() {
		const wrapperElement = document.getElementById(this.id);
		// Check if the 'id' property is missing or invalid
		if (!this.id) {
			alert("tPlayer Error: Please enter a valid container name.");
			return false;
		}
		// Check if the 'wrapper' element associated with the given 'id' is missing
		if (!wrapperElement) {
			alert(`tPlayer Error: Element with id "${this.id}" not found.`);
			return false;
		} else {
			this.elements.wrapper = wrapperElement;
		}
		// Check if the 'playlist' property is missing or not provided
		if (!this.playlist) {
			alert("tPlayer Error: Please, add Playlist to tPlayer.");
			return false;
		} else {
			// Check Playlist and update items if necessary
			this.playlist.forEach((item, index) => {
				// Update artist if Album Artist is set
				if (this.settings.album.artist) {
					this.playlist[index].artist = this.settings.settings.album.artist;
				}
				// Update cover if Album Cover is set and cover usage is enabled
				if (this.settings.album.cover && this.settings.settings.album.cover != "" && this.settings.showCover) {
					this.playlist[index].cover = this.settings.settings.album.cover;
				}
			});
		}
	}

	createPlayer() {
		let playerCSS = '', headtag = document.head || document.getElementsByTagName('head')[0], styleTag = document.getElementById('tp-styles');

		this.utils.addClass(this.elements.wrapper, ["tp-wrapper", this.settings.rounded ? "tp-rounded" : "", this.settings.skin === "vertical" ? "tp-vertical" : ""]);
		this.buttonIcons = this.settings.rounded ? this.buttonIcons.rounded : this.buttonIcons.default;

		// Player Structure
		this.elements.wrapper.innerHTML = `
			<div class="tp-player-wrapper">
				<div class="tp-cover-wrapper">
					<div class="tp-cover-loader"><span></span><span></span><span></span></div>
					<ul class="tp-cover-list">${this.getCovers()}</ul>
				</div>
				<div class="tp-player-controls-wrapper">
					<div class="tp-player-header">
						<div class="tp-song-title"></div>
					</div>
					<div class="tp-player-controls">
						<div class="tp-playback-button tp-button"><svg viewBox="0 0 20 20"><path d="${this.buttonIcons.playback.play}"></path></svg></div>
						<div class="tp-audio-seekbar">
							<div class="tp-audio-buffer-progress"></div>
							<div class="tp-audio-playback-progress"></div>
							<div class="tp-current-time">00:00</div>
							<div class="tp-duration">00:00</div>
							<div class="tp-player-loader"><span></span><span></span><span></span></div>
						</div>
						<div class="tp-prev-button tp-button"><svg viewBox="0 0 20 20"><path class="tp-stroke" d="${this.buttonIcons.prev.stroke}"></path><path class="tp-fill" d="${this.buttonIcons.prev.fill}"></path></svg></div>
						<div class="tp-repeat-button tp-button"><svg viewBox="0 0 20 20"><path class="tp-fill" d="${this.buttonIcons.repeat.fill}"></path><path class="tp-stroke" d="${this.buttonIcons.repeat.stroke}"></path></div>
						<div class="tp-next-button tp-button"><svg viewBox="0 0 20 20"><path class="tp-fill" d="${this.buttonIcons.next.fill}"></path><path class="tp-stroke" d="${this.buttonIcons.next.stroke}"></path></div>
						<div class="tp-shuffle-button tp-button"><svg viewBox="0 0 20 20"><path class="tp-fill" d="${this.buttonIcons.shuffle.fill}"></path><path class="tp-stroke" d="${this.buttonIcons.shuffle.stroke}"></path></svg></div>
					</div>
					<div class="tp-player-footer">
						<div class="tp-toggle-playlist-button tp-button"><svg viewBox="0 0 20 20"><path class="tp-stroke" d="${this.buttonIcons.playlist.closed}"></path></svg></div>
						<div class="tp-volume-control-wrapper">
							<div class="tp-volume-button tp-button">
								<svg viewBox="0 0 20 20">
									<path class="tp-fill" d="${this.buttonIcons.volume.speaker}"></path>
									<path class="tp-stroke" d="${this.buttonIcons.volume.line_1}"></path>
									<path class="tp-stroke" d="${this.buttonIcons.volume.line_2}"></path>
									<path class="tp-stroke" d="${this.buttonIcons.volume.muted}"></path>
								</svg>
							</div>
							<div class="tp-volume-level-bar">
								<div class="tp-volume-level"></div>
							</div>
						</div>
					</div>
				</div>
			</div>
			<div class="tp-playlist-wrapper">
				<div class="tp-scrollbar-track">
					<div class="tp-scrollbar-thumb"></div>
				</div>
				<ul class="tp-playlist">${this.createPlaylist()}</ul>
			</div>
		`;

		// Create Styles
		if (!styleTag) {
			styleTag = document.createElement('style');
			styleTag.id = 'tp-styles';
			headtag.appendChild(styleTag);
			styleTag.setAttribute('type', 'text/css');
		}

		/* Player CSS  Style */
		let playerStyle = [{
			selector: ".tp-player-wrapper",
			properties: {
				background: this.settings.style.player.background
			}
		}, {
			selector: ".tp-cover-wrapper",
			properties: {
				background: this.settings.style.player.cover.background
			}
		}, {
			selector: ".tp-cover-loader span",
			properties: {
				background: this.settings.style.player.cover.loader
			}
		}, {
			selector: ".tp-player-header",
			properties: {
				color: this.settings.style.player.songtitle
			}
		}, {
			selector: ".tp-button::before",
			properties: {
				background: this.settings.style.player.buttons.wave
			}
		}, {
			selector: [".tp-playback-button path", ".tp-button .tp-stroke"],
			properties: {
				stroke: this.settings.style.player.buttons.normal
			}
		}, {
			selector: [".tp-playback-button path", ".tp-playback-button path", ".tp-button .tp-fill"],
			properties: {
				fill: this.settings.style.player.buttons.normal
			}
		}, {
			selector: [".tp-playback-button:hover path", ".tp-button:hover .tp-stroke"],
			properties: {
				stroke: this.settings.style.player.buttons.hover
			}
		}, {
			selector: [".tp-playback-button:hover path", ".tp-playback-button:hover path", ".tp-button:hover .tp-fill"],
			properties: {
				fill: this.settings.style.player.buttons.hover
			}
		}, {
			selector: [".tp-playback-button.tp-active path", ".tp-button.tp-active .tp-stroke", ".tp-playback-button.tp-active path", ".tp-button.tp-active .tp-stroke"],
			properties: {
				stroke: this.settings.style.player.buttons.active
			}
		}, {
			selector: [".tp-playback-button.tp-active path", ".tp-playback-button.tp-active path", ".tp-button.tp-active .tp-fill", ".tp-playback-button:active path", ".tp-playback-button:active path", ".tp-button:active .tp-fill"],
			properties: {
				fill: this.settings.style.player.buttons.hover
			}
		}, {
			selector: ".tp-audio-seekbar",
			properties: {
				background: this.settings.style.player.seek
			}
		}, {
			selector: ".tp-audio-buffer-progress",
			properties: {
				background: this.settings.style.player.buffered
			}
		}, {
			selector: [".tp-audio-playback-progress", ".tp-equalizer-wrapper"],
			properties: {
				background: this.settings.style.player.progress
			}
		}, {
			selector: [".tp-current-time", ".tp-duration"],
			properties: {
				color: this.settings.style.player.timestamps
			}
		}, {
			selector: ".tp-player-loader",
			properties: {
				background: this.settings.style.player.loader.background
			}
		}, {
			selector: ".tp-player-loader span",
			properties: {
				background: this.settings.style.player.loader.color
			}
		}, {
			selector: ".tp-volume-level-bar",
			properties: {
				background: this.settings.style.player.volume.seek
			}
		}, {
			selector: ".tp-volume-level",
			properties: {
				background: this.settings.style.player.volume.value
			}
		}, {
			selector: ".tp-playlist-wrapper",
			properties: {
				background: this.settings.style.playlist.background
			}
		}, {
			selector: ".tp-scrollbar-track",
			properties: {
				background: this.settings.style.playlist.scroll.track
			}
		}, {
			selector: ".tp-scrollbar-thumb",
			properties: {
				background: this.settings.style.playlist.scroll.thumb
			}
		}, {
			selector: ".tp-playlist-item",
			properties: {
				background: this.settings.style.playlist.background,
				color: this.settings.style.playlist.color,
				borderBottomColor: this.settings.style.playlist.separator
			}
		}, {
			selector: ".tp-playlist-item:hover",
			properties: {
				background: this.settings.style.playlist.hover.background,
				color: this.settings.style.playlist.hover.color,
				borderBottomColor: this.settings.style.playlist.hover.separator
			}
		}, {
			selector: ".tp-playlist-item.tp-active",
			properties: {
				background: this.settings.style.playlist.active.background,
				color: this.settings.style.playlist.active.color,
				borderBottomColor: this.settings.style.playlist.active.separator
			}
		}, {
			selector: ".tp-playlist-item .tp-playlist-indicator span",
			properties: {
				background: this.settings.style.playlist.color
			}
		}, {
			selector: ".tp-playlist-item:hover .tp-playlist-indicator span",
			properties: {
				background: this.settings.style.playlist.hover.color
			}
		}, {
			selector: ".tp-playlist-item.tp-active .tp-playlist-indicator span",
			properties: {
				background: this.settings.style.playlist.active.color
			}
		}, {
			selector: [".tp-playlist-item .tp-playlist-song-download", ".tp-playlist-item .tp-playlist-song-buy"],
			properties: {
				stroke: this.settings.style.playlist.color
			}
		}, {
			selector: [".tp-playlist-item:hover .tp-playlist-song-download", ".tp-playlist-item:hover .tp-playlist-song-buy"],
			properties: {
				stroke: this.settings.style.playlist.hover.color
			}
		}, {
			selector: [".tp-playlist-item.tp-active .tp-playlist-song-download", ".tp-playlist-item.tp-active .tp-playlist-song-buy"],
			properties: {
				stroke: this.settings.style.playlist.active.color
			}
		}];

		// Generate Styles
		playerStyle.forEach((item) => {
			let cssSelector = [];

			// Check if the selector is an array
			if (Array.isArray(item.selector)) {
				// If the selector is an array, iterate through each selector
				item.selector.forEach((name, index) => {
					// Prepend the component's ID to each selector to scope it
					cssSelector[index] = '#' + this.id + ' ' + item.selector[index];
				});
			} else {
				// If the selector is not an array, simply prepend the component's ID
				cssSelector = '#' + this.id + ' ' + item.selector;
			}

			// Start the CSS rule with the selector(s)
			playerCSS += cssSelector + ' {\n';

			// Iterate over the properties in the item
			for (var property in item.properties) {
				if (item.properties.hasOwnProperty(property)) {
					// Convert camelCase to kebab-case for CSS properties
					playerCSS += property.replace(/[A-Z]/g, function(m) {
						return "-" + m.toLowerCase();
					}) + ': ' + item.properties[property] + ';\n';
				}
			}

			// Close the CSS rule
			playerCSS += '}\n';
		});

		// Add Styles
		styleTag.appendChild(document.createTextNode(playerCSS));
	}

	getCovers() {
		return this.playlist.map(song => {
			let html;

			if(song.cover && song.cover !== "") {
				html = `<li class="tp-cover-item"><img class="tp-cover-image" src="${song.cover}"></li>`;
			} else {
				html = `<li class="tp-cover-item"></li>`;
			}
			
			return html;
		}).join("");
	}

	createPlaylist() {
		return this.playlist.map(song => {
			let songName = song.title && song.title !== "" ? "<b>" + song.artist + "</b> - " + song.title : "<b>" + song.artist + "</b>";
			let songTitle = song.title && song.title !== "" ? song.artist + " - " + song.title : song.artist;
			let html = `
				<div class="tp-playlist-item" title="${songTitle}">
					<div class="tp-playlist-indicator"><span></span><span></span><span></span></div>
					<div class="tp-playlist-song">${songName}</div>
					${song.download ? '<a href="' + song.download + '" download target="_blank" class="tp-playlist-song-download"><svg viewBox="0 0 20 20"><path d="' + this.buttonIcons.download + '"/></svg></a>' : ''}
					${song.buy ? '<a href="' + song.buy + '" target="_blank" class="tp-playlist-song-buy"><svg viewBox="0 0 20 20"><path d="' + this.buttonIcons.buy + '"/></svg></a>' : ''}
				</div>
			`;
			return html;
		}).join("");
	}

	prepareControls() {
		const query = selector => this.elements.wrapper.querySelector(selector);
		this.elements.songTitle = query(".tp-song-title");
		this.elements.coverWrapper = query(".tp-cover-wrapper");
		this.elements.coverList = query(".tp-cover-list");
		this.elements.playbackButton = query(".tp-playback-button");
		this.elements.audioSeekBar = query('.tp-audio-seekbar');
		this.elements.audioBufferedProgress = query('.tp-audio-buffer-progress');
		this.elements.audioPlaybackProgress = query('.tp-audio-playback-progress');
		this.elements.currentTime = query('.tp-current-time');
		this.elements.duration = query('.tp-duration');
		this.elements.prevButton = query(".tp-prev-button");
		this.elements.repeatButton = query(".tp-repeat-button");
		this.elements.nextButton = query(".tp-next-button");
		this.elements.shuffleButton = query(".tp-shuffle-button");
		this.elements.togglePlaylistButton = query(".tp-toggle-playlist-button");
		this.elements.volumeButton = query(".tp-volume-button");
		this.elements.volumeLevelBar = query(".tp-volume-level-bar");
		this.elements.volumeLevel = query(".tp-volume-level");
		this.elements.playlistWrapper = query(".tp-playlist-wrapper");
		this.elements.scrollbarTrack = query(".tp-scrollbar-track");
		this.elements.scrollbarThumb = query(".tp-scrollbar-thumb");
		this.elements.playlist = query(".tp-playlist");
		this.elements.playlistItem = this.elements.wrapper.querySelectorAll(".tp-playlist-item");
	}

	updatePlayerSettings() {
		// Covers
		if(!this.settings.showCover) {
			this.utils.addClass(this.elements.wrapper, "tp-no-cover");
		}

		// Scroll
		if (this.settings.enableScroll && this.playlist.length > this.settings.visibleTracks) {
			this.utils.addClass(this.elements.wrapper, "tp-scrollable");
			this.elements.playlist.style.height = 40 * this.settings.visibleTracks + "px";
		}

		// If Only One Song in Playlist:
		if(this.playlist.length === 1) {
			// Hide Repeat, Shuffle, Next and Prev
			[this.elements.togglePlaylistButton, this.elements.shuffleButton, this.elements.nextButton, this.elements.prevButton].forEach(element => element.style.display = "none");

			// If Has Download or Buy Link
			function createPlaylistLink(icon, url, classList) {
				let $link = document.createElement("a");
				$link.classList.add(...classList);
				$link.setAttribute("href", url);
				$link.setAttribute("target", "_blank");
				$link.innerHTML = `<svg viewBox="0 0 20 20"><path class="tp-stroke" d="${icon}"/></svg></a>`;
				return $link;
			}
			if (this.playlist[0].download) {
				let $download = createPlaylistLink(this.buttonIcons.download, this.playlist[0].download, ["tp-playlist-song-download", "tp-button"]);
				this.elements.togglePlaylist.insertAdjacentElement("afterend", $download);
			}
			if (this.playlist[0].buy) {
				let $buy = createPlaylistLink(this.buttonIcons.buy, this.playlist[0].buy, ["tp-playlist-song-buy", "tp-button"]);
				this.elements.togglePlaylist.insertAdjacentElement("afterend", $buy);
			}
		}

		// If Enabled Show Playlist
		if(this.settings.showPlaylist) {
			this.togglePlaylist();
		}

		// If Disabled Shuffle
		if(!this.settings.showShuffleButton) {
			this.elements.shuffleButton.style.display = "none";
		}

		// If Disabled Repeat
		if(!this.settings.showRepeatButton) {
			this.elements.repeatButton.style.display = "none";
		}

		// If It's Mobile Phone
		if (this.state.isMobile) {
			[this.elements.volumeButton, this.elements.volumeLevelBar].forEach(element => element.style.display = "none");
		}
	}

	prepareEvents() {
		/* AUDIO */
		let audioEvents = ['abort', 'canplay', 'canplaythrough', 'durationchange', 'emptied', 'ended', 'error', 'loadeddata', 'loadedmetadata', 'loadstart', 'pause', 'play', 'playing', 'progress', 'ratechange', 'seeked', 'seeking', 'stalled', 'suspend', 'timeupdate', 'volumechange', 'waiting'];
		// Add all Audio Events
		audioEvents.forEach((event) => {
			this.audio.addEventListener(event, this[event].bind(this));
		});

		// Buttons
		const elements = this.elements;
		// Playback
		elements.playbackButton.addEventListener('click', this.playback.bind(this));
		// Previous Song
		elements.prevButton.addEventListener('click', this.prevSong.bind(this));
		// Next Song
		elements.nextButton.addEventListener('click', this.nextSong.bind(this));
		// Volume Toggle
		elements.volumeButton.addEventListener('click', this.volumeToggle.bind(this));
		// Repeat Toggle
		elements.repeatButton.addEventListener('click', this.repeatToggle.bind(this));
		// Shuffle Toggle
		elements.shuffleButton.addEventListener('click', this.shuffleToggle.bind(this));
		// Playlist Toggle
		elements.togglePlaylistButton.addEventListener('click', this.togglePlaylist.bind(this));

		// Playlist's Items Events
		elements.playlistItem.forEach((item, index) => {
			const download = item.querySelector('.tp-playlist-song-download');
			const buy = item.querySelector('.tp-playlist-song-buy');

			// Select Song From Playlist
			item.addEventListener('click', () => {
				// IF CLICK ON NEW SONG
				if (this.currentSong.index !== index) {
					this.lastSongIndex = this.currentSong.index;
					this.currentSong.index = index;
					this.state.autoplay = true;
					this.switchSong();
				} else if(this.audio.paused) {
					this.playback();
				}
			});

			// Prevent Download and Buy Clicks
			if (download || buy) {
				const preventClick = (event) => {
					event.stopPropagation();
				};
				if (download) download.addEventListener('click', preventClick);
				if (buy) buy.addEventListener('click', preventClick);
			}
		});

		// Seeking Audio
		if (this.state.isMobile) {
			elements.audioSeekBar.addEventListener('touchstart', this.seekingStart.bind(this), { passive: true });
		} else {
			elements.audioSeekBar.addEventListener('mousedown', this.seekingStart.bind(this), false);
			elements.volumeLevelBar.addEventListener('mousedown', this.volumeSeekingStart.bind(this), false);
		}

		// Scroll Bar
		this.elements.playlistWrapper.addEventListener('mouseenter', this.showScrollbar.bind(this));
		this.elements.playlistWrapper.addEventListener('mouseleave', this.hideScrollbar.bind(this));
		// Listen for scroll events to update the thumb position dynamically
		this.elements.playlist.addEventListener('scroll', this.updateScrollbarThumb.bind(this));
		// Handle mouse wheel scrolling
		this.elements.scrollbarTrack.addEventListener('wheel', (event) => {
			event.preventDefault();
			// Adjust scrollTop by the wheel delta
			this.elements.playlist.scrollTop += event.deltaY;
		}, {passive: false});
		// Handle mouse down events for scrollbar dragging or simple click scrolling
		this.elements.scrollbarTrack.addEventListener('mousedown', this.scrollbarTrackSeekingStart.bind(this));

		// Resize Event
		window.addEventListener("resize", this.playerResize.bind(this));
	}

	/* AUDIO EVENTS */
	abort() {
		// console.log("Abort");

		this.isSeeking(false);
		this.state.canUpdateRadioInfo = false;
	};

	// Can Play
	canplay() {
		// console.log("Can Play");

		// Remove Loading State
		this.utils.removeClass(this.elements.wrapper, 'tp-loading');
		this.isSeeking(true);
	};

	// Can Play Through
	canplaythrough() {
		// console.log("Can Play Through");

		// Remove Loading State
		this.utils.removeClass(this.elements.wrapper, 'tp-loading');
		this.isSeeking(true);

		// If Autoplay
		if (this.state.autoplay) {
			this.audio.play();
		}
	};

	// Durationchange
	durationchange() {
		// console.log("Duration Change");

		this.elements.duration.textContent = this.utils.formatTime(this.audio.duration);
		this.elements.duration.style = this.audio.duration !== Infinity ? "block" : "none";
		this.isSeeking(true);
	};

	// Emptied
	emptied() {
		// console.log("Emptied");

		this.isSeeking(false);
		this.state.canUpdateRadioInfo = false;
	};

	// Ended
	ended() {
		// console.log("Ended");

		// Play Next
		this.nextSong();
	};

	// Error
	error() {
		// console.log("Error");

		this.isSeeking(false);
		const errorCodes = {
			1: 'The user canceled the audio.',
			2: 'A network error occurred while fetching the audio.',
			3: 'An error occurred while decoding the audio.',
			4: 'The audio is missing or is in a format not supported by your browser.',
			default: 'An unknown error occurred.'
		};
		const errorCode = errorCodes[this.audio.error.code] || errorCodes['default'];
		this.state.canUpdateRadioInfo = false;
		this.pause();
		this.state.autoplay = false;
		// Remove Loading State
		this.utils.removeClass(this.elements.wrapper, 'tp-loading');
		console.log("tPlayer Error: " + errorCode);
	};

	// Load Start
	loadstart() {
		// console.log("Load Start");

		// Add Loading State
		this.utils.addClass(this.elements.wrapper, 'tp-loading');
	};

	// Loaded data
	loadeddata() {
		// console.log("Loaded Data");

		this.isSeeking(true);
	};

	// Loaded metadata
	loadedmetadata() {
		// console.log("Loaded Meta Data");

		this.elements.duration.textContent = this.utils.formatTime(this.audio.duration);
		this.elements.duration.style = this.audio.duration !== Infinity ? "block" : "none";
		this.isSeeking(true);
	};

	// Pause
	pause() {
		// console.log("Pause");
		// Remove 'playing' class from Playlist items
		this.utils.removeClass(this.elements.playlistItem, 'tp-playing');
		// Button State
		this.utils.removeClass(this.elements.playbackButton, 'tp-active');
		setTimeout(() => {
			this.elements.playbackButton.querySelector('path').setAttribute('d', this.buttonIcons.playback.play);
		}, 200);
		this.state.canUpdateRadioInfo = false;
	};

	// Play
	play() {
		// console.log("Play");

		// Stop others Players
		for (let player in tPlayersCollection) {
			if (player !== this.id) {
				tPlayersCollection[player].pause();
			}
		}
		// Set Playing Song in Playlist
		this.utils.addClass(this.elements.playlistItem[this.currentSong.index], 'tp-playing');
		// Button State
		this.utils.addClass(this.elements.playbackButton, 'tp-active');
		setTimeout(() => {
			this.elements.playbackButton.querySelector('path').setAttribute('d', this.buttonIcons.playback.pause);
		}, 200);
		this.isSeeking(true);
		this.state.canUpdateRadioInfo = true;
	};

	// Playing
	playing() {
		// console.log("Playing");

		// Remove Loading State
		this.utils.removeClass(this.elements.wrapper, 'tp-loading');
		this.isSeeking(true);
		this.state.canUpdateRadioInfo = true;
	};

	// Progress
	progress() {
		// console.log("Progress Buffer");

		if (this.audio.buffered.length) {
			let duration = this.audio.duration,
				buffered = this.audio.buffered.end(this.audio.buffered.length - 1),
				progress = buffered / duration;

			this.elements.audioBufferedProgress.style.width = `${progress * 100}%`;
			this.elements.audioBufferedProgress.style.opacity = progress === 1 ? 0 : 1;
		}
	};

	// Rate Change
	ratechange(){
		// console.log("Rate Change");
	};

	// Seeked
	seeked() {
		// console.log("Seeked");

		// Remove Loading State
		this.utils.removeClass(this.elements.wrapper, 'tp-loading');
	};

	// Seeking
	seeking() {
		// console.log("Seeking");

		// Add Loading State
		this.utils.addClass(this.elements.wrapper, 'tp-loading');
	};

	// Staled
	stalled() {
		// console.log("Stalled");

		this.isSeeking(false);
		this.state.canUpdateRadioInfo = false;
	};

	// Suspend
	suspend() {
		// console.log("Suspend");
	};

	// TimeUpdate
	timeupdate() {
		// console.log("Time Update");

		if (!this.state.seeking) {
			// Set Current Time
			this.currentSong.currentTime = this.audio.currentTime;
			// Get Percents
			const percent = (this.currentSong.currentTime / this.audio.duration) * 100;
			// Set value for seek progress
			this.elements.audioPlaybackProgress.style.width = percent + '%';
			// Set Curent Time in Player
			this.elements.currentTime.textContent = this.utils.formatTime(this.audio.currentTime);
			this.progress();
		}
	};

	// Volume Change
	volumechange() {
		// console.log("Volume Change");

		let paths = this.elements.volumeButton.children[0].children;
		// Set volume level in player
		this.volume = this.audio.volume !== 0 ? this.audio.volume : this.volume;
		this.elements.volumeLevel.style.width = this.audio.volume * 100 + '%';

		paths[1].style.transform = this.audio.volume < 0.25 ? "scale(0)" : "scale(1)";
		paths[2].style.transform = this.audio.volume < 0.5 ? "scale(0)" : "scale(1)";
		paths[3].style.transform = this.audio.volume === 0 ? "scale(1)" : "scale(0)";

		if(this.audio.volume === 0) {
			this.state.volumeToggle = true;
			this.utils.addClass(this.elements.volumeButton, 'tp-active');
		} else {
			this.state.volumeToggle = false;
			this.utils.removeClass(this.elements.volumeButton, 'tp-active');
		}
	};

	// Waiting
	waiting() {
		// console.log("Waiting");

		// Add Loading State
		this.utils.addClass(this.elements.wrapper, 'tp-loading');
		this.isSeeking(false);
		this.state.canUpdateRadioInfo = false;
	};


	/* PLAYER UI EVENTS */
	// Set Button Click Animation
	setButtonClick(element) {
		this.utils.addClass(element, "tp-click");
		setTimeout(() => {
			this.utils.removeClass(element, "tp-click");
		}, 400);
	}

	// Playback
	playback() {
		this.setButtonClick(this.elements.playbackButton);
		if (this.audio.paused) {
			this.audio.play();
			this.state.autoplay = true;
		} else {
			this.audio.pause();
			this.state.autoplay = false;
		}
	}

	// Previous song
	prevSong() {
		this.setButtonClick(this.elements.prevButton);
		this.lastSongIndex = this.currentSong.index;

		// If Shuffle Mode is On
		if(this.state.shuffle) {
			// Set Current Song to the First Index of the Order List and Remove It
			this.currentSong.index = this.orderList.shift();
			// If the Order List is Now Empty, Get a New Order List
			if(this.orderList.length === 0) {
				this.orderList = this.utils.getOrderList();
			}
		} else {
			// If Shuffle Mode is Off
			// If there is a Previous Song in the Playlist
			if(this.currentSong.index - 1 >= 0) {
				// Decrement the Current Song Index
				this.currentSong.index--;
			} else {
				// If There is No Previous Song and Repeat Mode is On Play the Last Song in the Playlist
				if(this.state.repeat) {
					this.currentSong.index = this.playlist.length - 1;
				} else {
					// If Repeat Mode is Off, Pause the Audiom Set Current Time to 0 and Turn Off Autoplay
					this.audio.pause();
					this.audio.currentTime = 0;
					this.state.autoplay = false;
					return;
				}
			}
		}

		// Switch To the Next Song
		this.switchSong();
	}

	// Next Song
	nextSong() {
		this.setButtonClick(this.elements.nextButton);
		this.lastSongIndex = this.currentSong.index;

		// If Shuffle Mode is On
		if(this.state.shuffle) {
			// Set Current Song to the First Index of the Order List and Remove It
			this.currentSong.index = this.orderList.shift();
			// If the Order List is Now Empty, Get a New Order List
			if(this.orderList.length === 0) {
				this.orderList = this.utils.getOrderList();
			}
		} else {
			// If Shuffle Mode is Off
			// If There is a Next Song in the Playlist
			if(this.currentSong.index + 1 < this.playlist.length) {
				// Increment the Current Song Index
				this.currentSong.index++;
			} else {
				// If Repead Mode is On
				if(this.state.repeat) {
					// Set Current Song to the First Song in the Playlist
					this.currentSong.index = 0;
				} else {
					// If Repeat Mode is Off, Pause the Audiom Set Current Time to 0 and Turn Off Autoplay
					this.audio.pause();
					this.audio.currentTime = 0;
					this.state.autoplay = false;
					return;
				}
			}
		}

		// Switch To the Next Song
		this.switchSong();
	}

	// Repeat Toggle
	repeatToggle() {
		// Toggle State
		this.state.repeat = !this.state.repeat;
		// Toggle Classes
		this.utils.toggleClass(this.elements.repeatButton, "tp-active");
		this.setButtonClick(this.elements.repeatButton);
	}

	// Shuffle Toggle
	shuffleToggle() {
		// Toggle State
		this.state.shuffle = !this.state.shuffle;
		// Toggle Classes
		this.utils.toggleClass(this.elements.shuffleButton, "tp-active");
		this.setButtonClick(this.elements.shuffleButton);
		this.orderList = (this.state.shuffle) ? this.utils.getOrderList() : null;
	}

	// Playlist Show And Hide
	togglePlaylist() {
		let playlistHeight = 0;

		// Toggle State
		this.state.togglePlaylist = !this.state.togglePlaylist;
		// Toggle Classes
		this.utils.toggleClass(this.elements.togglePlaylistButton, "tp-active");
		this.setButtonClick(this.elements.togglePlaylistButton);

		// Show or Hide Playlist
		if (this.state.togglePlaylist) {
			// Button Icons Change
			this.utils.animatePathD(
				this.elements.togglePlaylistButton.querySelector('path'),
				this.buttonIcons.playlist.closed,
				this.buttonIcons.playlist.opened,
				250,
				'easeOutExpo'
			);

			// Calculate Playlist Height
			if(this.playlist.length > this.settings.visibleTracks && this.settings.enableScroll) {
				playlistHeight = this.settings.visibleTracks * 40 - 1;
			} else {
				playlistHeight = this.playlist.length * 40;
			}
		} else {
			// Button Icons Change
			this.utils.animatePathD(
				this.elements.togglePlaylistButton.querySelector('path'),
				this.buttonIcons.playlist.opened,
				this.buttonIcons.playlist.closed,
				250,
				'easeOutExpo'
			);
		}
		// Set Height
		this.elements.playlistWrapper.style.height = playlistHeight + 'px';
	}

	// Volume Toggle
	volumeToggle() {
		// Toggle State
		this.state.volumeToggle = !this.state.volumeToggle;
		// Toggle Classes
		this.utils.toggleClass(this.elements.volumeButton, "tp-active");
		this.setButtonClick(this.elements.volumeButton);
		// Set Volume
		this.audio.volume = this.state.volumeToggle ? 0 : this.volume;
		// Set Volume Level in Player
		this.elements.volumeLevel.style.width = this.state.volumeToggle ? this.audio.volume * 100 : 0;
	}

	// Seeking
	seekingStart(event) {
		event.preventDefault();
		// For desktop, ensure left mouse button is used
		if(!this.state.isMobile && event.button !== 0) return false;

		this.state.seeking = true;
		this.seekingTo(event); // If No MouseMove, Set Value From Start

		const moveEvent = this.state.isMobile ? 'touchmove' : 'mousemove';
		const upEvent = this.state.isMobile ? 'touchend' : 'mouseup';

		document.addEventListener(moveEvent, this.seekingTo.bind(this), false);
		document.addEventListener(upEvent, this.seekingEnd.bind(this), false);

		this.elements.currentTime.style.transition = "";
		this.elements.duration.style.transition = "";
	}

	// Seeking To
	seekingTo(event) {
		if(!this.state.seeking) {
			return;
		}

		let bound = this.elements.audioSeekBar.getBoundingClientRect();
		// Get Mouse Position
		let mousePosition = this.state.isMobile ? event.touches[0].clientX : event.clientX;
		let percent = (mousePosition - bound.left) / bound.width;
		// Fix Percent: If Percent > 1 return 1, If Percent < 0 return 0, Else Return Percent
		percent = Math.max(0, Math.min(1, percent));
		// Set Progress
		this.elements.audioPlaybackProgress.style.width = `${percent * 100}%`;
		// Set Current Time
		this.currentSong.currentTime = percent * this.audio.duration;
		this.elements.currentTime.textContent = this.utils.formatTime(this.currentSong.currentTime);

		// Get Current Time and Duration Position While Seeking
		const currentTimeOffset = mousePosition - bound.left - this.elements.currentTime.offsetWidth - 5;
		const durationOffset = bound.width - (mousePosition - bound.left) - this.elements.duration.offsetWidth - 5;
		// Set Current Time and Duration Positon While Seeking
		if(percent !== 0 && percent !== 1) {
			this.elements.currentTime.style.left = `${currentTimeOffset}px`;
			this.elements.duration.style.right = `${durationOffset}px`;
		}
	}

	// Seeking End
	seekingEnd(event) {
		this.state.seeking = false;
		// Remove Events
		const moveEvent = this.state.isMobile ? 'touchmove' : 'mousemove';
		const upEvent = this.state.isMobile ? 'touchend' : 'mouseup';
		document.removeEventListener(moveEvent, this.seekingTo.bind(this), false);
		document.removeEventListener(upEvent, this.seekingEnd.bind(this), false);

		// Set Current Time For Audio
		this.audio.currentTime = this.currentSong.currentTime;

		// Set Current Time And Duration Position
		this.elements.currentTime.style.transition = "all 250ms var(--easeOutExpo)";
		this.elements.duration.style.transition = "all 250ms var(--easeOutExpo)";
		this.elements.currentTime.style.left = "5px";
		this.elements.duration.style.right = "5px";
	}

	// Volume Seeking
	volumeSeekingStart(event) {
		event.preventDefault();
		// For desktop, ensure left mouse button is used
		if(event.button !== 0) return false;

		this.state.volumeSeeking = true;
		this.volumeSeekingTo(event); // If No MouseMove, Set Value From Start

		document.addEventListener('mousemove', this.volumeSeekingTo.bind(this), false);
		document.addEventListener('mouseup', this.volumeSeekingEnd.bind(this), false);
	}

	// Volume Seeking To
	volumeSeekingTo(event) {
		if(!this.state.volumeSeeking) {
			return;
		}

		let bound = this.elements.volumeLevelBar.getBoundingClientRect();
		// Get Mouse Position
		let mousePosition = event.clientX;
		let percent = (mousePosition - bound.left) / bound.width;
		// Fix Percent: If Percent > 1 return 1, If Percent < 0 return 0, Else Return Percent
		percent = Math.max(0, Math.min(1, percent));
		// Set Volume
		this.audio.volume = percent;
	}

	// Volume Seeking End
	volumeSeekingEnd() {
		this.state.volumeSeeking = false;
		// Remove Events
		document.removeEventListener('mousemove', this.volumeSeekingTo.bind(this), false);
		document.removeEventListener('mouseup', this.volumeSeekingEnd.bind(this), false);
	}

	// Function to update the scrollbar thumb's size and position
	updateScrollbarThumb() {
		var visibleRatio = this.elements.playlist.clientHeight / this.elements.playlist.scrollHeight;

		// Set thumb height relative to the visible portion of the playlist, with a minimum of 10%
		this.elements.scrollbarThumb.style.height = Math.max(visibleRatio * 100, 10) + "%";

		// Position the thumb based on the current scroll position
		this.elements.scrollbarThumb.style.top = (this.elements.playlist.scrollTop / this.elements.playlist.scrollHeight) * 100 + "%";
	}

	showScrollbar() {
		this.utils.addClass(this.elements.playlistWrapper, 'tp-playlist-hovered')
		clearTimeout(this.state.scrollMouseLeaveTimeout);
	}
	
	hideScrollbar() {
		this.state.scrollMouseLeaveTimeout = setTimeout(() => {
			this.utils.removeClass(this.elements.playlistWrapper, 'tp-playlist-hovered')
		}, 2000);
	}

	scrollbarTrackSeekingStart(event) {
    event.preventDefault();

    const initialMouseY = event.clientY; // Starting Y position of the mouse
    const initialScrollTop = this.elements.playlist.scrollTop; // Initial scroll position
    const maxScrollPosition = this.elements.playlist.scrollHeight - this.elements.playlist.clientHeight; // Max scroll position
    let isDragging = false; // Flag to detect dragging vs. clicking

    // Function to handle mouse movements for dragging
    const scrollbarTrackSeeking = (event) => {
      const dragDeltaY = event.clientY - initialMouseY; // Mouse movement distance

      // Determine if dragging has started (more than 5px of movement)
      if (Math.abs(dragDeltaY) > 5) {
        isDragging = true;
      }

      // Calculate new scroll position relative to the drag distance and track size
      const newScrollTop = initialScrollTop + (dragDeltaY / this.elements.scrollbarTrack.clientHeight) * maxScrollPosition;

      // Set the new scrollTop, ensuring it doesn't exceed bounds
      this.elements.playlist.scrollTop = Math.max(0, Math.min(newScrollTop, maxScrollPosition));
    };

    // Function to handle mouse release (mouseup event)
    const scrollbarTrackSeekingEnd = (event) => {
      document.removeEventListener("mousemove", scrollbarTrackSeeking);
      document.removeEventListener("mouseup", scrollbarTrackSeekingEnd);

      // If it was a simple click (no dragging), scroll to the click position
      if (!isDragging) {
        const clickPositionY = event.clientY;
        const trackRect = this.elements.scrollbarTrack.getBoundingClientRect();
        const clickRatio = (clickPositionY - trackRect.top) / this.elements.scrollbarTrack.clientHeight; // Position in % on the track
        const newScrollTop = clickRatio * maxScrollPosition;

        // Scroll to the clicked position
        this.elements.playlist.scrollTop = Math.max(0, Math.min(newScrollTop, maxScrollPosition));
			}
		};

    // Add event listeners for dragging and releasing the mouse
    document.addEventListener("mousemove", scrollbarTrackSeeking);
    document.addEventListener("mouseup", scrollbarTrackSeekingEnd);
	}

	/* PLAYER FUNCTION */
	// ALLOW SEEKING
	isSeeking(state) {
		this.elements.audioSeekBar.style.pointerEvents = state && this.audio.duration !== Infinity ? "all" : "none";
	}

	// Switch Song
	switchSong() {
		let scrollDistance = 0;
		this.state.canUpdateRadioInfo = false;

		// Reset Progress
		this.elements.audioBufferedProgress.style.width = "0px";
		this.elements.audioPlaybackProgress.style.width = "0px";
		this.audio.pause();
		this.audio.currentTime = 0;

		// Load Song
		this.audio.src = this.playlist[this.currentSong.index].audio;
		this.audio.volume = this.state.volumeToggle ? 0 : this.volume;

		// Remove Classes "Active" and "Playing" from All Playilst Items
		this.utils.removeClass(this.elements.playlistItem, ['tp-active', 'tp-playing']);
		// Add Class "Active" to Current Playilst Item
		this.utils.addClass(this.elements.playlistItem[this.currentSong.index], 'tp-active');
		// If Autoplay is On
		if(this.state.autoplay) {
			// Play
			this.audio.play();
			this.state.canUpdateRadioInfo = true;
		}

		// Auto Scroll
		if(this.settings.enableScroll && this.playlist.length > this.settings.visibleTracks && this.state.togglePlaylist) {
			if(this.currentSong.index + 1 >= this.settings.visibleTracks) {
				scrollDistance = 40 * (this.currentSong.index - this.settings.visibleTracks + 1);
			}
			// Scroll To
			this.elements.playlist.scrollTo({
				top: scrollDistance,
				behavior: 'smooth'
			});
		}

		// Update Current Song Information
		this.currentSong.artist = this.playlist[this.currentSong.index].artist;
		this.currentSong.title = this.playlist[this.currentSong.index].title;
		this.currentSong.cover = this.playlist[this.currentSong.index].cover;

		// Change Song Title
		this.animateTextChange({
			artist: this.playlist[this.lastSongIndex].artist,
			title: this.playlist[this.lastSongIndex].title
		}, {
			artist: this.currentSong.artist,
			title: this.currentSong.title
		});

		this.elements.songTitle.setAttribute('title', `${this.currentSong.artist} - ${this.currentSong.title}`);

		// Check If Covers
		if(this.playlist[this.currentSong.index].cover && this.playlist[this.currentSong.index].cover !== "" && this.settings.showCover) {
			this.utils.removeClass(this.elements.wrapper, 'tp-no-cover');
			// Slide Covers
			if(this.settings.isRadio) {
				const coverImage = this.elements.coverList.children[this.currentSong.index].querySelector('img');
				coverImage.setAttribute('src', this.playlist[this.currentSong.index].cover);
			}
			this.elements.coverList.style.top = -this.elements.coverWrapper.offsetHeight * this.currentSong.index + 'px';
		} else {
			this.utils.addClass(this.elements.wrapper, 'tp-no-cover');
		}
	}

	// Radio Update
	async updateRadioInfo() {
		if(!this.state.canUpdateRadioInfo || this.state.waitingRadioInfo) return;

		const {index: currentIndex, artist: currentArtist, title: currentTitle, cover: currentCover} = this.currentSong;
		const audioUrl = this.playlist[this.currentSong.index].audio;
		const updateCovers = this.settings.showCover ? this.settings.updateRadioCovers : false;
		const fetchParams = {
			method: 'POST',
			mode: 'same-origin',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				url: audioUrl,
				cover: updateCovers
			})
		};

		this.state.waitingRadioInfo = true;

		fetch(`${this.settings.pluginPath}/assets/tp-radio-info.php`, fetchParams).then(response => {
			return response.json();
		}).then(data => {
			this.state.waitingRadioInfo = false;
			// If User Change Radio Abort
			if(currentIndex !== this.currentSong.index) return;

			if(data) {
				const {artist: newArtist, title: newTitle, cover: newCover} = data;

				if(currentArtist !== newArtist || currentTitle !== newTitle) {
					// Change Song Title
					this.animateTextChange({
						artist: this.currentSong.artist,
						title: this.currentSong.title
					}, {
						artist: newArtist,
						title: newTitle
					});

					this.currentSong.artist = newArtist;
					this.currentSong.title = newTitle;
					this.elements.songTitle.setAttribute('title', `${this.currentSong.artist} - ${this.currentSong.title}`);
				}

				if(this.settings.showCover) {
					// Determine if we need to add or remove the cover class
					const shouldShowCover = newCover || currentCover;
					if (shouldShowCover) {
						this.utils.removeClass(this.elements.wrapper, "tp-no-cover");
					} else {
						this.utils.addClass(this.elements.wrapper, "tp-no-cover");
					}
					// Update the current song's cover if it's new and different from the current cover
					this.currentSong.cover = (newCover && currentCover !== newCover) ? newCover : currentCover;
					// Update the cover image source in the cover list
					const coverImage = this.elements.coverList.children[this.currentSong.index].querySelector('img');
					coverImage.setAttribute('src', this.currentSong.cover);
				}
			}
		}).catch(error => {
			console.error(error);
			this.state.waitingRadioInfo = false;
		});
	}

	// Function to animate the text change for the song title and artist
	animateTextChange(previousSong, currentSong) {
		// Clear any existing animation interval to prevent multiple animations running simultaneously
		if (this.titleAnimationInterval) {
			clearInterval(this.titleAnimationInterval);
		}

		// Extract artist and title from previous and current song objects
		let previousArtist = previousSong.artist;
		let currentArtist = currentSong.artist;
		let previousTitle = previousSong.title ? previousSong.title : " ";
		let currentTitle = currentSong.title ? currentSong.title : " ";
	
		// Function to update the text in the element, adjusting artist and title
		const updateText = () => {
			// Adjust the artist text based on its length compared to the current artist
			previousArtist = this.adjustText(previousArtist, currentArtist);
				
			// Adjust the title text based on its length compared to the current title
			previousTitle = this.adjustText(previousTitle, currentTitle);
				
			// Update the song title element with the new artist and title
			if(previousTitle !== " ") {
				this.elements.songTitle.innerHTML = `<b>${previousArtist}</b> - ${previousTitle}`;
			} else  {
				this.elements.songTitle.innerHTML = `<b>${previousArtist}</b>`;
			}

			// Check if both artist and title have been fully updated to the current values
			if (previousArtist === currentArtist && previousTitle === currentTitle) {
				// Clear the interval once the animation is complete
				clearInterval(this.titleAnimationInterval);
			}
		};

		// Set a new interval for the animation to update every 7 milliseconds
		this.titleAnimationInterval = setInterval(updateText, 7); // Interval for smooth animation
	}

	// Function to adjust the length of the text by either trimming or expanding it
	adjustText(previousText, currentText) {
		// If the previous text is longer than the current text, trim the previous text
		if (previousText.length > currentText.length) {
			return previousText.slice(0, -1); // Remove the last character
		} 
		// If the previous text is shorter than the current text, expand the previous text
		else if (previousText.length < currentText.length) {
			return currentText.slice(0, previousText.length + 1); // Add the next character
		}
		// If both texts are of the same length, return the current text
		return currentText; // Texts are the same length
	}

	// Resize
	playerResize() {
		if(this.elements.wrapper.clientWidth < 550) {
			this.utils.addClass(this.elements.wrapper, 'tp-vertical');
		} else {
			if(this.settings.skin !== 'vertical') {
				this.utils.removeClass(this.elements.wrapper, 'tp-vertical');
			}
		}
		// this.elements.coverWrapper.style.height = this.elements.coverWrapper.clientWidth + 'px';
	}

	init() {
		this.validatePlayerConfig();
		this.createPlayer();
		this.prepareControls();
		this.updatePlayerSettings();
		this.prepareEvents();
		this.switchSong();
		this.updateScrollbarThumb();
		this.playerResize()
		// Radio Update
		// if its radio init updater
		if(this.settings.isRadio && this.settings.pluginPath) {
			setInterval(this.updateRadioInfo.bind(this), this.settings.updateRadioInterval);
		}
	}

	/* UTILITES */
	utils = {
		// Add Class
		addClass: (elements, classes) => {
			const elementList = (typeof elements === "string") ? document.querySelectorAll(elements) : (elements instanceof Element) ? [elements] : elements;
			const classList = Array.isArray(classes) ? classes : [classes];
			elementList.forEach(element => {
				classList.forEach(cls => {
					if (cls) element.classList.add(cls);
				});
			});
		},
		// Remove Class
		removeClass: (elements, classes) => {
			const elementList = (typeof elements === "string") ? document.querySelectorAll(elements) : (elements instanceof Element) ? [elements] : elements;
			const classList = Array.isArray(classes) ? classes : [classes];
			elementList.forEach(element => {
				classList.forEach(cls => {
					if (cls) element.classList.remove(cls);
				});
			});
		},
		// Toggle Class
		toggleClass: (elements, classes) => {
			const elementList = (typeof elements === "string") ? document.querySelectorAll(elements) : (elements instanceof Element) ? [elements] : elements;
			const classList = Array.isArray(classes) ? classes : [classes];
			elementList.forEach(element => {
				classList.forEach(cls => {
					if (cls) element.classList.toggle(cls);
				});
			});
		},
		// Extend Object Deep
		deepMerge: (source, destination) => {
			return Object.entries(source).reduce((response, [key, value]) => {
				if (!(key in destination)) {
					response[key] = value;
				} else if (typeof value === "object" && value !== null) {
					response[key] = this.deepMerge(value, destination[key]);
				} else {
					response[key] = destination[key];
				}

				return response;
			}, {})
		},
		// Detect Mobile
		detectMobile: () => {
			var toMatch = [/Android/i, /webOS/i, /iPhone/i, /iPad/i, /iPod/i, /BlackBerry/i, /Windows Phone/i];
			return toMatch.some(function(toMatchItem) {
				return navigator.userAgent.match(toMatchItem);
			});
		},
		// Format Time
		formatTime: (totalSeconds) => {
			if(totalSeconds == Infinity) {
				return "00:00";
			}
			totalSeconds = parseInt(totalSeconds, 10);
			const h = Math.floor(totalSeconds / 3600);
			const m = Math.floor(totalSeconds / 60) % 60;
			const s = totalSeconds % 60;

			const timeArr = [h, m, s];
			const formattedArr = timeArr.map(function(value) {
				return value < 10 ? "0" + value : value;
			});
			const filteredArr = formattedArr.filter(function(value, index) {
				return value !== "00" || index > 0;
			});
			return filteredArr.join(":");
		},
		getOrderList: () => {
			let array = [], i, j, temp = null;
			// Create Array of Nums from 0 to Playlist Length
			for (i = 0; i < this.playlist.length; i++) {
				if (i !== this.currentSong.index) {
					array.push(i);
				}
			}
			// Shuffle Array and Return
			for (i = array.length - 1; i > 0; i--) {
				j = Math.floor(Math.random() * (i + 1));
				temp = array[i];
				array[i] = array[j];
				array[j] = temp;
			}
			return array;
		},
		animatePathD: (pathElement, fromD, toD, duration = 1000, easing = 'linear', callback) => {
			let startTime = null;
		
			// Function to interpolate the 'd' attribute of the path element
			function interpolateD(from, to, progress) {
				// Split 'd' attribute values into commands and numbers
				const fromCommands = from.match(/[a-zA-Z]+|[-.\d]+/g);
				const toCommands = to.match(/[a-zA-Z]+|[-.\d]+/g);
		
				let result = '';
				let isNumber = false;
		
				// Iterate over each command/number pair
				for (let i = 0; i < fromCommands.length; i++) {
					if (isNaN(fromCommands[i])) {
						// If it's a command (e.g., M, L), append it to the result
						result += (isNumber ? ' ' : '') + fromCommands[i];
						isNumber = false; // The next value will be a number
					} else {
						// If it's a number, interpolate between 'from' and 'to' values
						const fromValue = parseFloat(fromCommands[i]);
						const toValue = parseFloat(toCommands[i]);
						const interpolatedValue = fromValue + (toValue - fromValue) * progress;
		
						// Determine decimal places based on progress (more precise during animation)
						result += (isNumber ? ',' : ' ') + interpolatedValue;
		
						isNumber = true; // The next value will be a number
					}
				}
		
				return result;
			}
		
			// Function to handle the animation frame
			const animate = (currentTime) => {
				if (!startTime) startTime = currentTime; // Initialize start time on first frame
				const elapsedTime = currentTime - startTime; // Calculate elapsed time
				const progress = Math.min(elapsedTime / duration, 1); // Normalize progress to a value between 0 and 1
		
				// Apply easing function to smooth the progress
				const easedProgress = this.utils.easingFunctions[easing](progress);
		
				// Update the 'd' attribute of the path element with interpolated values
				pathElement.setAttribute('d', interpolateD(fromD, toD, easedProgress));
		
				// Continue animating if progress is less than 1, otherwise call the callback function
				if (progress < 1) {
					requestAnimationFrame(animate); // Request next animation frame
				} else if (callback) {
					callback(); // Call the callback function when animation is complete
				}
			};
		
			requestAnimationFrame(animate); // Start the animation
		},
		easingFunctions: {
			linear: (time) => {
				return time;
			},
			easeInSine: (time) => {
				return -1 * Math.cos(time * (Math.PI / 2)) + 1;
			},
			easeOutSine: (time) => {
				return Math.sin(time * (Math.PI / 2));
			},
			easeInOutSine: (time) => {
				return -0.5 * (Math.cos(Math.PI * time) - 1);
			},
			easeInQuad: (time) => {
				return time * time;
			},
			easeOutQuad: (time) => {
				return time * (2 - time);
			},
			easeInOutQuad: (time) => {
				return time < 0.5 ? 2 * time * time : -1 + (4 - 2 * time) * time;
			},
			easeInCubic: (time) => {
				return time * time * time;
			},
			easeOutCubic: (time) => {
				const time1 = time - 1;
				return time1 * time1 * time1 + 1;
			},
			easeInOutCubic: (time) => {
				return time < 0.5 ?
					4 * time * time * time :
					(time - 1) * (2 * time - 2) * (2 * time - 2) + 1;
			},
			easeInQuart: (time) => {
				return time * time * time * time;
			},
			easeOutQuart: (time) => {
				const time1 = time - 1;
				return 1 - time1 * time1 * time1 * time1;
			},
			easeInOutQuart: (time) => {
				const time1 = time - 1;
				return time < 0.5 ? 8 * time * time * time * time : 1 - 8 * time1 * time1 * time1 * time1;
			},
			easeInQuint: (time) => {
				return time * time * time * time * time;
			},
			easeOutQuint: (time) => {
				const time1 = time - 1;
				return 1 + time1 * time1 * time1 * time1 * time1;
			},
			easeInOutQuint: (time) => {
				const time1 = time - 1;
				return time < 0.5 ? 16 * time * time * time * time * time : 1 + 16 * time1 * time1 * time1 * time1 * time1;
			},
			easeInExpo: (time) => {
				if (time === 0) {
					return 0;
				}
				return Math.pow(2, 10 * (time - 1));
			},
			easeOutExpo: (time) => {
				if (time === 1) {
					return 1;
				}
				return (-Math.pow(2, -10 * time) + 1);
			},
			easeInOutExpo: (time) => {
				if (time === 0 || time === 1) {
					return time;
				}
		
				const scaledTime = time * 2;
				const scaledTime1 = scaledTime - 1;
		
				if (scaledTime < 1) {
					return 0.5 * Math.pow(2, 10 * (scaledTime1));
				}
		
				return 0.5 * (-Math.pow(2, -10 * scaledTime1) + 2);
			},
			easeInCirc: (time) => {
				const scaledTime = time / 1;
				return -1 * (Math.sqrt(1 - scaledTime * time) - 1);
			},
			easeOutCirc: (time) => {
				const time1 = time - 1;
				return Math.sqrt(1 - time1 * time1);
			},
			easeInOutCirc: (time) => {
				const scaledTime = time * 2;
				const scaledTime1 = scaledTime - 2;
		
				if (scaledTime < 1) {
					return -0.5 * (Math.sqrt(1 - scaledTime * scaledTime) - 1);
				}
		
				return 0.5 * (Math.sqrt(1 - scaledTime1 * scaledTime1) + 1);
			},
			easeInBack: (time, magnitude = 1.70158) => {
				return time * time * ((magnitude + 1) * time - magnitude);
			},
			easeOutBack: (time, magnitude = 1.70158) => {
				const scaledTime = time / 1 - 1;
				return (scaledTime * scaledTime * ((magnitude + 1) * scaledTime + magnitude)) + 1;
			},
			easeInOutBack: (time, magnitude = 1.70158) => {
				const scaledTime = time * 2;
				const scaledTime2 = scaledTime - 2;
				const s = magnitude * 1.525;
		
				if (scaledTime < 1) {
					return 0.5 * scaledTime * scaledTime * ((s + 1) * scaledTime - s);
				}
		
				return (0.5 * (scaledTime2 * scaledTime2 * ((s + 1) * scaledTime2 + s) + 2));
			},
			easeInElastic: (time, magnitude = 0.7) => {
				if (time === 0 || time === 1) {
					return time;
				}
		
				const scaledTime = time / 1;
				const scaledTime1 = scaledTime - 1;
				const p = 1 - magnitude;
				const s = p / (2 * Math.PI) * Math.asin(1);
		
				return -(Math.pow(2, 10 * scaledTime1) * Math.sin((scaledTime1 - s) * (2 * Math.PI) / p));
			},
			easeOutElastic: (time, magnitude = 0.7) => {
				if (time === 0 || time === 1) {
					return time;
				}
		
				const p = 1 - magnitude;
				const scaledTime = time * 2;
				const s = p / (2 * Math.PI) * Math.asin(1);
		
				return (Math.pow(2, -10 * scaledTime) * Math.sin((scaledTime - s) * (2 * Math.PI) / p)) + 1;
			},
			easeInOutElastic: (time, magnitude = 0.65) => {
				if (time === 0 || time === 1) {
					return time;
				}
		
				const p = 1 - magnitude;
				const scaledTime = time * 2;
				const scaledTime1 = scaledTime - 1;
				const s = p / (2 * Math.PI) * Math.asin(1);
		
				if (scaledTime < 1) {
					return -0.5 * (Math.pow(2, 10 * scaledTime1) * Math.sin((scaledTime1 - s) * (2 * Math.PI) / p));
				}
		
				return (Math.pow(2, -10 * scaledTime1) * Math.sin((scaledTime1 - s) * (2 * Math.PI) / p) * 0.5) + 1;
			},
			easeOutBounce: (time) => {
				const scaledTime = time / 1;
		
				if (scaledTime < (1 / 2.75)) {
					return 7.5625 * scaledTime * scaledTime;
				} else if (scaledTime < (2 / 2.75)) {
					const scaledTime2 = scaledTime - (1.5 / 2.75);
					return (7.5625 * scaledTime2 * scaledTime2) + 0.75;
				} else if (scaledTime < (2.5 / 2.75)) {
					const scaledTime2 = scaledTime - (2.25 / 2.75);
					return (7.5625 * scaledTime2 * scaledTime2) + 0.9375;
				} else {
					const scaledTime2 = scaledTime - (2.625 / 2.75);
					return (7.5625 * scaledTime2 * scaledTime2) + 0.984375;
				}
			},
			easeInBounce: (time) => {
				return 1 - this.utils.easingFunctions.easeOutBounce(1 - time);
			},
			easeInOutBounce: (time) => {
				if (time < 0.5) {
					return this.utils.easingFunctions.easeInBounce(time * 2) * 0.5;
				}
				return (this.utils.easingFunctions.easeOutBounce((time * 2) - 1) * 0.5) + 0.5;
			}
		}
	};

	// Button Icons
	buttonIcons = {
		default: {
			playback: {
				play: "M0,0 10,5 10,15 0,20z M10,5 20,10 20,10 10,15z",
				pause: "M0,0 3,0 3,20 0,20z M17,0 20,0 20,20, 17,20z",
			},
			prev: {
				stroke: "M1.5,0 1.5,20",
				fill: "M20,0 20,20 1,10z"
			},
			repeat: {
				stroke: "M1.5,12 1.5,3.5 14,3.5 M18.5,8 18.5,16 6,16.5",
				fill: "M13,0 20,3.5 13,7z M7,13 7,20 0,16.5z"
			},
			next: {
				stroke: "M18.5,0 18.5,20",
				fill: "M0,0 19,10 0,20z"
			},
			shuffle: {
				stroke: "M1,19 17,3 M1,1 8,8 M12,12 17,17",
				fill: "M12,0 20,0 20,8z M20,12 20,20 12,20z"
			},
			playlist: {
				closed: "M0,3 20,3 M0,10 20,10 M0,17 20,17",
				opened: "M1.5,1.5 18.5,18.5 M10,10 10,10 M1.5,18.5 18.5,1.5 "
			},
			volume: {
				speaker: "M10,0 10,20 4,15 0,15 0,5 4,5z",
				line_1: "M14,14.5c1.2-1.1,2-2.7,2-4.5s-0.8-3.4-2-4.5",
				line_2: "M15,17.5c2.4-1.6,4-4.4,4-7.5s-1.6-5.9-4-7.5",
				muted: "M14,7.5 19,12.5 M14,12.5 19,7.5"
			},
			download: "M1,10v9h18v-9 M10,0v13 M8,11h4l-2,3L8,11z",
			buy: "M11,0v9 M9,7h4l-2,3L9,7z M0,5h3l2,8h13l1-5 M6,17c0-1.1,0.9-2,2-2s2,0.9,2,2s-0.9,2-2,2S6,18.1,6,17 M13,17c0-1.1,0.9-2,2-2c1.1,0,2,0.9,2,2s-0.9,2-2,2C13.9,19,13,18.1,13,17"
		},
		rounded: {
			playback: {
				play: "M1.5,1.5 18.5,10 18.5,10 1.5,18.5z M18.5,10 18.5,10 18.5,10 18.5,10z",
				pause: "M1.5,1.5 2.5,1.5 2.5,18.5 1.5,18.5z M17.5,1.5 18.5,1.5 18.5,18.5 17.5,18.5z",
			},
			prev: {
				stroke: "M1.5,1.5 1.5,18.5",
				fill: "M20,2.1v15.9c0,1.6-1.6,2.5-3,1.8L2.1,11.8c-1.4-0.8-1.4-2.9,0-3.7L17,0.2C18.4-0.5,20,0.5,20,2.1z"
			},
			repeat: {
				stroke: "M1.5,11 1.5,3.5 14,3.5 M18.5,9 18.5,16.5 6,16.5",
				fill: "M7,18.8v-4.6c0-0.9-1-1.5-1.8-1.1l-4.6,2.3c-0.9,0.4-0.9,1.7,0,2.2l4.6,2.3C6,20.3,7,19.7,7,18.8z M13,1.2v4.6c0,0.9,1,1.5,1.8,1.1l4.6-2.3c0.9-0.4,0.9-1.7,0-2.2l-4.6-2.3C14-0.3,13,0.3,13,1.2z"
			},
			next: {
				stroke: "M18.5,1.5 18.5,18.5",
				fill: "M3,0.2l14.9,7.9c1.4,0.8,1.4,2.9,0,3.7L3,19.8c-1.4,0.7-3-0.3-3-1.8V2.1C0,0.5,1.6-0.5,3,0.2z"
			},
			shuffle: {
				stroke: "M1.5,18.5 17,3 M1.5,1.5 6.5,6.5 M13.5,13.5 16,16",
				fill: "M13.2,0h5.6C19.5,0,20,0.5,20,1.2v5.6c0,1.1-1.3,1.6-2.1,0.9l-5.6-5.6C11.6,1.3,12.1,0,13.2,0z M13.2,20h5.6c0.7,0,1.2-0.5,1.2-1.2v-5.6c0-1.1-1.3-1.6-2.1-0.9l-5.6,5.6C11.6,18.7,12.1,20,13.2,20z"
			},
			playlist: {
				closed: "M2,3 18,3 M2,10 18,10 M2,17 18,17",
				opened: "M2,2 18,18 M10,10 10,10 M2,18 18,2"
			},
			volume: {
				speaker: "M9.4,0.1C9-0.1,8.6,0,8.3,0.3L3.6,5H1C0.4,5,0,5.4,0,6v8c0,0.6,0.4,1,1,1h2.6l4.7,4.7C8.5,19.9,8.7,20,9,20  c0.1,0,0.3,0,0.4-0.1C9.8,19.8,10,19.4,10,19V1C10,0.6,9.8,0.2,9.4,0.1z",
				line_1: "M14,14.5c1.2-1.1,2-2.7,2-4.5s-0.8-3.4-2-4.5",
				line_2: "M15,17.5c2.4-1.6,4-4.4,4-7.5s-1.6-5.9-4-7.5",
				muted: "M14,7.5 19,12.5 M14,12.5 19,7.5"
			},
			download: "M1,10v9h18v-9 M10,1v12 M8,11h4l-2,3L8,11z",
			buy: "M11,1v7 M9,7h4l-2,3L9,7z M1,5h2l2,8h13l1-5 M6,17c0-1.1,0.9-2,2-2s2,0.9,2,2s-0.9,2-2,2S6,18.1,6,17 M13,17c0-1.1,0.9-2,2-2s2,0.9,2,2s-0.9,2-2,2S13,18.1,13,17"
		}
	};
}

function tPlayer(options) {
	return new tPlayerClass(options);
}