import {
    IsNotEmpty,
    IsString,
    Matches,
    MaxLength,
} from 'class-validator';

export class CreateCompteDto {

    @IsNotEmpty({
        message: 'Le code du compte est obligatoire.',
    })
    @Matches(/^[A-Z]{3}[0-9]{3}$/, {
        message:
            'Le code doit être au format SAG001, IRA001, AMO001...',
    })
    code!: string;

    @IsNotEmpty({
        message: 'Le nom du compte est obligatoire.',
    })
    @IsString({
        message: 'Le nom doit être une chaîne de caractères.',
    })
    @MaxLength(100, {
        message: 'Le nom ne doit pas dépasser 100 caractères.',
    })
    nom!: string;
}