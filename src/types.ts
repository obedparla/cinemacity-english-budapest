type URL = string;

interface Film {
    id: string;
    name: string;
    length: number;
    posterLink: URL;
    videoLink: URL;
    link: URL;
    weight: number;
    releaseYear: string;
    attributeIds: string[];
}

interface BookingUrl {
    url: URL;
    params: {
        lang: string;
        [key: string]: string;
    };
}

interface CompositeBookingLink {
    type: string;
    bookingUrl: BookingUrl;
    obsoleteBookingUrl: URL;
    blockOnlineSales: boolean;
    blockOnlineSalesUntil: string | null;
    serviceUrl: URL;
}

interface Event {
    id: string;
    filmId: string;
    cinemaId: string;
    businessDay: string;
    eventDateTime: string;
    attributeIds: string[];
    bookingLink: URL;
    compositeBookingLink: CompositeBookingLink;
    presentationCode: string;
    soldOut: boolean;
    auditorium: string;
    auditoriumTinyName: string;
}

export interface MoviesData {
    body: {
        films: Film[];
        events: Event[];
    }
}

