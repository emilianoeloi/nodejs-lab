// iAtualizar Todos uma vez por dia
var podcast = require('podcastrss'),
    categoryDAO = require('category'),
    podcastDAO = require('podcastMongo'),
    statFirefoxos = require('statFirefoxos'),
    podcastList = [],
    current = 0,
    timer = null;

function processPodcast(options) {
    podcast.process(options, function (data) {

        if(typeof(data.mp3) != 'string'){
            data.mp3 = '';
        }
        data.podcaster = options.podcaster;
        data.country = options.country;
        podcastDAO.get(data, function (rows) {
            if (rows && rows.length == 0 && data.mp3 && data.mp3 != '') {
                podcastDAO.insert(data, function(inserted){
                    console.log('inserido--->', inserted.podcaster);
                });
            }
        }, function (err) {
            console.log('podcast get error', err);
        })

    });
}

var bastardosOptions = {
    'url':'http://www.poderato.com/bastardos/_feed/1',
    'remove':'Programa numero',
    'separator':'!',
    'podcaster': {
        name: 'bastardos',
        title: 'Bastardos'
    },
    'country': 'Uruguay'
}
podcastList.push(bastardosOptions);

var carPodcastOptions = {
    'url':'http://feeds.feedburner.com/cpuy',
    'remove':'',
    'separator':'',
    'podcaster': {
        name: 'carpodcast',
        title: 'CarPodcast'
    },
    'country': 'Uruguay'
}
podcastList.push(carPodcastOptions);

var elTrianguloObtusoOptions = {
    'url':'http://feeds.feedburner.com/trianguloobtuso',
    'remove':'Podcast',
    'separator':':',
    'podcastName': 'eltrianguloobtuso',
    'podcaster': {
        name: 'eltrianguloobtuso',
        title: 'El Triángulo Obtuso'
    },
    'country': 'Uruguay'
}
podcastList.push(elTrianguloObtusoOptions);

var enPerspectivaOptions = {
    'url':'http://podcast.espectador.com/en_perspectiva.xml',
    'remove':'',
    'separator':':',
    'podcastName': 'enperpectiva',
    'podcaster': {
        name: 'enperpectiva',
        title: 'En perspectiva'
    },
    'country': 'Uruguay'
}
podcastList.push(enPerspectivaOptions);

var venganzaOptions = {
    'url':'http://podcast.espectador.com/la_venganza_sera_terrible.xml',
    'remove':'',
    'separator':'',
    'podcastName': 'venganza',
    'podcaster': {
        name: 'venganza',
        title: 'La Venganza Será Terrible'
    },
    'country': 'Uruguay'
}
podcastList.push(venganzaOptions);

var tertuliaOptions = {
    'url':'http://podcast.espectador.com/la_tertulia.xml',
    'remove':'',
    'separator':'',
    'podcastName': 'tertulia',
    'podcaster': {
        name: 'tertulia',
        title: 'La Tertulia'
    },
    'country': 'Uruguay'
}
podcastList.push(tertuliaOptions);

var radioLevelUpOptions = {
    'url':'http://www.radiolevelup.com/category/Podcast/feed/',
    'remove':'',
    'separator':'',
    'podcastName': 'radiolevelup',
    'podcaster': {
        name: 'radiolevelup',
        title: 'Radio Level Up'
    },
    'country': 'Uruguay'
}
podcastList.push(radioLevelUpOptions);

var radioMundoRealOptions = {
    'url':'http://www.radiomundoreal.fm/spip.php?page=backend&lang=es',
    'remove':'',
    'separator':'',
    'podcastName': 'radiomundoreal',
    'podcaster': {
        name: 'radiomundoreal',
        title: 'Radio Mundo Real'
    },
    'country': 'Uruguay'
}
podcastList.push(radioMundoRealOptions);

var exardiumOptions = {
    'url':'http://feeds2.feedburner.com/blogspot/Exordium-Podcast',
    'remove':'',
    'separator':'',
    'podcastName': 'exordium',
    'podcaster': {
        name: 'exordium',
        title: 'Exordium'
    },
    'country': 'Uruguay'
}
podcastList.push(exardiumOptions);

var beercastOptions = {
    'url':'http://www.beercast.com.br/feed/',
    'remove':'',
    'separator':'',
    'podcastName': 'beercast',
    'podcaster': {
        name: 'beercast',
        title: 'Beercast'
    },
    'country': 'Brasil'
}
podcastList.push(beercastOptions);

var nerdcastOptions = {
    'url':'http://jovemnerd.com.br/feed/?cat=42',
    'remove':'Nerdcast',
    'separator':'\u2013',
    'podcastName': 'nerdcast',
    'podcaster': {
        name: 'nerdcast',
        title: 'Nerdcast'
    },
    'country': 'Brasil'
}
podcastList.push(nerdcastOptions);

var roncaroncaOptions = {
    'url':'http://oifm-api.oi.com.br/api/services/site/rss/podcasts/RoncaRonca',
    'remove':'',
    'separator':'',
    'podcastName': 'roncaronca',
    'podcaster': {
        name: 'roncaronca',
        title: 'roNca roNca'
    },
    'country': 'Brasil'
}
podcastList.push(roncaroncaOptions);

var escribacafeOptions = {
    'url':'http://www.escribacafe.com/feed/podcast/',
    'remove':'Podcast',
    'separator':'\u2013',
    'podcastName': 'ecribacafe',
    'country': 'Brasil'
}
//podcastList.push(escribacafeOptions);

var mrgOptions = {
    'url':'http://jovemnerd.com.br/categoria/matando-robos-gigantes/feed/',
    'remove':'MRG',
    'separator':':',
    'podcastName': 'mrg',
    'country': 'Brasil'
}
//podcastList.push(mrgOptions);

var mdmOptions = {
    'url':'http://melhoresdomundo.net/category/podcast/feed/',
    'remove':'Podcast MdM',
    'separator':'',
    'podcastName': 'mdm',
    'country': 'Brasil'
}
//podcastList.push(mdmOptions);

var rfppOptions = {
    'url':'http://radiofobia.com.br/category/podcast/feed/?redirect=no',
    'remove':'RADIOFOBIA',
    'separator':'-',
    'podcastName': 'radiofobia',
    'podcaster': {
        name: 'radiofobia',
        title: 'Rádiofobia'
    },
    'country': 'Brasil'
}
podcastList.push(rfppOptions);

/**
 * México Podcast Player
 */
var elPodcastSinNombreOptions = {
    'url':'http://feeds.feedburner.com/ElPodcastSinNombre',
    'remove':'',
    'separator':'',
    'podcastName': 'elPodcastSinNombre',
    'podcaster': {
        name: 'elPodcastSinNombre',
        title: 'El Podcast Sin Nombre'
    },
    'country': 'Mexico'
}
podcastList.push(elPodcastSinNombreOptions);

var bytePodcastOptions = {
    'url':'http://feeds.feedburner.com/Byte',
    'remove':'',
    'separator':'',
    'podcastName': 'bytePodcast',
    'podcaster': {
        name: 'bytePodcast',
        title: 'Byte Podcast'
    },
    'country': 'Mexico'
}
podcastList.push(bytePodcastOptions);

var areaPodcastOptions = {
    'url':'http://feeds.feedburner.com/areapodcast',
    'remove':'',
    'separator':'',
    'podcastName': 'areaPodcast',
    'podcaster': {
        name: 'areaPodcast',
        title: 'Area Podcast'
    },
    'country': 'Mexico'
}
podcastList.push(areaPodcastOptions);

var testigosDelCrimenOptions = {
    'url':'http://podcasts.frecuenciacero.com.mx/podcasts/testigosdelcrimen.xml',
    'remove':'',
    'separator':'',
    'podcastName': 'testigosDelCrimen',
    'podcaster': {
        name: 'testigosDelCrimen',
        title: 'Testigos del Crimen'
    },
    'country': 'Mexico'
}
podcastList.push(testigosDelCrimenOptions);

var eslPodOptions = {
    'url':'http://feeds.feedburner.com/EnglishAsASecondLanguagePodcast',
    'remove':'',
    'separator':'',
    'podcastName': 'eslPod',
    'podcaster': {
        name: 'eslPod',
        title: 'English as a Second Language Podcast'
    },
    'country': 'USA'
}
podcastList.push(eslPodOptions);

var gavestaticaOptions = {
    'url':'http://feeds.feedburner.com/gavestatica',
    'remove':'',
    'separator':'',
    'podcastName': 'gavestatica',
    'podcaster': {
        name: 'gavestatica',
        title: 'Gavestática'
    },
    'country': 'Brasil'
}
podcastList.push(gavestaticaOptions);

var cinemaEmCenaOptions = {
    'url':'http://cinemaemcena.podbean.com/feed/',
    'remove':'',
    'separator':'',
    'podcastName': 'cinemaemcena',
    'podcaster': {
        name: 'cinemaemcena',
        title: 'Cinema em cena'
    },
    'country': 'Brasil'
}
podcastList.push(cinemaEmCenaOptions);

var scicastOptions = {
    'url':'http://www.scicast.com.br/_SciCast/oldRSS/SciCast_feedburner_RSS.xml',
    'remove':'',
    'separator':'',
    'podcastName': 'scicast',
    'podcaster': {
        name: 'scicast',
        title: 'SciCast'
    },
    'country': 'Brasil'
}
podcastList.push(scicastOptions);

var noventaNoveVidasOptions = {
    'url':'http://99vidas.com.br/category/99vidas/feed/',
    'remove':'',
    'separator':'',
    'podcastName': 'noventaNoveVidas',
    'podcaster': {
        name: 'noventaNoveVidas',
        title: '99Vidas'
    },
    'country': 'Brasil'
}
podcastList.push(noventaNoveVidasOptions);

var rapaduracastOptions = {
    'url':'http://www.cinemacomrapadura.com.br/rapaduracast/rapaduracast.xml',
    'remove':'',
    'separator':'',
    'podcastName': 'rapaduracast',
    'podcaster': {
        name: 'rapaduracast',
        title: 'Rapaduracast'
    },
    'country': 'Brasil'
}
podcastList.push(rapaduracastOptions);

var anticastOptions = {
    'url':'http://feeds.feedburner.com/anticastdesign',
    'remove':'',
    'separator':'',
    'podcastName': 'anticast',
    'podcaster': {
        name: 'anticast',
        title: 'AntiCast'
    },
    'country': 'Brasil'
}
podcastList.push(anticastOptions);

var fueraDeSeriesOptions = {
    'url':'http://www.fueradeseries.com/feed/podcast/',
    'remove':'',
    'separator':'',
    'podcastName': 'fueradeseries',
    'podcaster': {
        name: 'fueradeseries',
        title: 'Fuera de Series'
    },
    'country': 'España'
}
podcastList.push(fueraDeSeriesOptions);

var sinaudienciaOptions = {
    'url':'http://sinaudiencia.com/feed/',
    'remove':'',
    'separator':'',
    'podcastName': 'sinaudiencia',
    'podcaster': {
        name: 'sinaudiencia',
        title: 'Sinaudiencia'
    },
    'country': 'España'
}
podcastList.push(sinaudienciaOptions);

var pegadinhaMucaoOptions = {
    'url':'http://feeds.feedburner.com/mucaoaovivo',
    'remove':'',
    'separator':'',
    'podcastName': 'pegadinhaMucao',
    'podcaster': {
        name: 'pegadinhaMucao',
        title: 'Pegadinha do Mução'
    },
    'country': 'Brasil'
}
podcastList.push(pegadinhaMucaoOptions);

for(var index in podcastList){
    var podcastToProcess = podcastList[index];
    processPodcast(podcastToProcess);
}
