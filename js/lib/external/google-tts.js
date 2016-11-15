/**
 * The API instance.
 *
 * @param defaultLanguage Optional. The language to use when not specified. 'en' is default.
 * @constructor
 */
class TTS {

  constructor(defaultLanguage) {
    /**
     * Default language (code).
     * @type {String}
     */
    this.defaultLanguage = defaultLanguage || 'en';

    /**
     * Maximum no. of characters which can be be submitted in a single request.
     *
     * This value was found through trial-and-error, see https://github.com/hiddentao/google-tts/issues/9
     * @type {Number}
     */
    let MAX_CHARS_PER_REQUEST = 100,

      /**
       * Full list of languages.
       * @type {Object}
       */
      languages = {
        'af': 'Afrikaans',
        'sq': 'Albanian',
        'ar': 'Arabic',
        'hy': 'Armenian',
        'ca': 'Catalan',
        'zh-CN': 'Mandarin (simplified)',
        'zh-TW': 'Mandarin (traditional)',
        'hr': 'Croatian',
        'cs': 'Czech',
        'da': 'Danish',
        'nl': 'Dutch',
        'en': 'English',
        'eo': 'Esperanto',
        'fi': 'Finnish',
        'fr': 'French',
        'de': 'German',
        'el': 'Greek',
        'ht': 'Haitian Creole',
        'hi': 'Hindi',
        'hu': 'Hungarian',
        'is': 'Icelandic',
        'id': 'Indonesian',
        'it': 'Italian',
        'ja': 'Japanese',
        'ko': 'Korean',
        'la': 'Latin',
        'lv': 'Latvian',
        'mk': 'Macedonian',
        'no': 'Norwegian',
        'pl': 'Polish',
        'pt': 'Portuguese',
        'ro': 'Romanian',
        'ru': 'Russian',
        'sr': 'Serbian',
        'sk': 'Slovak',
        'es': 'Spanish',
        'sw': 'Swahili',
        'sv': 'Swedish',
        'ta': 'Tamil',
        'th': 'Thai',
        'tr': 'Turkish',
        'vi': 'Vietnamese',
        'cy': 'Welsh'
      };


    /**
     * Available players.
     * @type {Array}
     * @private
     */
    this._players = [
      new TTS.HTML5Player(),
      new TTS.SM2Player()
    ];


    /**
     * Add in a playback mechanism.
     *
     * @param pm TTS.Player a concrete subclass instance.
     * @throws Error if passed-in item is not an instance of GoogleTTS.Player
     */
    this.addPlayer = (pm) => {
      if (!(pm instanceof TTS.Player))
        throw new Error('Must be a instance of base Player class');

      this._players.push(pm);
    };


    /**
     * Get supported languages.
     * @return {Object} hashtable (language code -> description)
     */
    this.languages = () => {
      return languages;
    };


    /**
     * Get first available player.
     *
     * If the resulting playback mechanism is null then it means no playback mechanism is available for use.
     *
     * @param cb Function Result callback (Error err, TTS.Player pm)
     */
    this.getPlayer = (cb) => {
      if (this.availablePlayer) {
        return cb(null, this.availablePlayer);
      }

      var _testNextMechanism,
        index = -1;

      (_testNextMechanism = () => {
        // none available?
        if (this._players.length <= (++index)) {
          return cb();
        }

        this._players[index].available((canPlay) => {
          if (canPlay) {
            this.availablePlayer = this._players[index];
            return cb(null, this.availablePlayer);
          } else {
            _testNextMechanism();
          }
        });
      }).call();
    };


    /**
     * Construct the URLs to fetch the speech audio for given text and language.
     * @param txt {String} the text.
     * @param lang {String} the language of the text. If omitted then default language is used.
     */
    this.urls = (txt, lang) => {
      lang = lang || this.defaultLanguage;

      if (!txt || 0 >= txt.length)
        throw new Error('Need some text');

      var slices = this._sliceInput(txt, MAX_CHARS_PER_REQUEST),
        urls = [];

      for (let i = 0; i < slices.length; ++i) {
        let slice = slices[i];

        urls.push(
          'http://translate.google.com/translate_tts?ie=UTF-8&tl=' + lang + '&q=' + encodeURIComponent(slice) + '&textlen=' + slice.length + '&idx=' + i + '&total=' + slices.length
        );
      }

      return urls;
    };


    /**
     * Slice up given input text.
     * @param txt {String} the input text.
     * @param maxSliceLength {Integer} maximum length of each slice.
     * @return {Array} list of slices.
     * @private
     */
    this._sliceInput = (txt, maxSliceLength) => {
      var slices = [],
        start = 0;

      do {
        slices.push(txt.slice(start, start + maxSliceLength));
        start += maxSliceLength;
      } while (txt.length > start);

      return slices;
    };


    /**
     * Fetch and play the speech audio for given text and language.
     *
     * @param txt the text.
     * @param lang the language of the text. If omitted then default language is used.
     * @param cb Completion callback with signature (err).
     */
    this.play = (txt, lang, cb) => {
      this.getPlayer(function (err, player) {
        if (err) {
          return cb(err);
        }
        if (!player) {
          return cb(new Error('No playback mechanism is available'));
        }

        let urls = this.urls(txt, lang),
          _playFn = null;

        (_playFn = function (err) {
          if (err) return cb(err);
          if (0 >= urls.length) return cb();

          player.play(urls.shift(), _playFn);
        }).call();

      });
    };

    return this;
  };
}

/**
 * Represents a playback mechanism.
 * @constructor
 */
class TTSPlayer {

  constructor() {
    /**
     * Get whether this playback mechanism is available for use.
     * @param cb Function Result callback (Boolean available)
     */
    this.available = function (cb) {
      throw new Error('Not yet implemented');
    };


    /**
     * Play given URL.
     * @param url String
     * @param cb Function Called after we finish playing (Error err)
     */
    this.play = function (url, cb) {
      throw new Error('Not yet implemented');
    };


    /**
     * Get name of this player.
     */
    this.toString = function () {
      throw new Error('Not yet implemented');
    };
  };
}

/**
 * Playback using HTML5 Audio.
 * @constructor
 */
class HTML5Player extends TTSPlayer {
  constructor() {
    this._available = null;

    this.available = function (cb) {
      if (null === this._available) {

        // check if HTML5 audio playback is possible
        ((next) => {
          try {
            if ('undefined' === typeof window.Audio) {
              return next(null, false);
            }
            var audio = new Audio();

            //Shortcut which doesn't work in Chrome (always returns ""); pass through
            // if "maybe" to do asynchronous check by loading MP3 data: URI
            if ('probably' === audio.canPlayType('audio/mpeg')) {
              return next(null, true);
            }
            //If this event fires, then MP3s can be played
            audio.addEventListener('canplaythrough', function () {
              next(null, true);
            }, false);

            //If this is fired, then client can't play MP3s
            audio.addEventListener('error', function () {
              next(null, false);
            }, false);

            //Smallest base64-encoded MP3 I could come up with (less than 0.000001 seconds long)
            audio.src = "data:audio/mpeg;base64,/+MYxAAAAANIAUAAAASEEB/jwOFM/0MM/90b/+RhST//w4NFwOjf///PZu////9lns5GFDv//l9GlUIEEIAAAgIg8Ir/JGq3/+MYxDsLIj5QMYcoAP0dv9HIjUcH//yYSg+CIbkGP//8w0bLVjUP///3Z0x5QCAv/yLjwtGKTEFNRTMuOTeqqqqqqqqqqqqq/+MYxEkNmdJkUYc4AKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq";

            audio.load();
          } catch (e) {
            next(e);
          }
        })((err, canPlay) => {
          if (err) {
            console.log(err);
          }

          this._available = canPlay;

          cb(this._available);
        });

        return;
      }

      cb(this._available);
    };

    this.play = (url, cb) => {
      // load the MP3
      try {
        var audio = new Audio();
        audio.src = url;
        audio.addEventListener('ended', function () {
          cb();
        });
        audio.play();
      } catch (e) {
        return cb(e);
      }
    };

    this.toString = function () {
      return 'HTML5 Audio';
    };
  }

}


/**
 * Playback using SoundManager2 (https://github.com/scottschiller/SoundManager2).
 * @constructor
 */
class SM2Player extends TTSPlayer {
  constructor() {

    this._available = null;
    this._soundId = 0;
    this._unique_instance_id = parseInt(Math.random() * 1000, 10);

    this.available = function (cb) {
      if (null === this._available) {
        if ('undefined' !== typeof window.soundManager && 'function' === typeof window.soundManager.ok) {
          this._available = window.soundManager.ok();
        }
      }

      cb(this._available);
    };

    this.play = function (url, cb) {
      try {
        (window.soundManager.createSound({
          id: 'googletts-' + this._unique_instance_id + '-' + (++this._soundId),
          url: url,
          onfinish: cb
        })).play();
      } catch (err) {
        cb(err);
      }
    };

    this.toString = function () {
      return 'SoundManager2';
    };
  };
}
