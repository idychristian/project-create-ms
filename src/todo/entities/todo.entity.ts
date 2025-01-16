import { Column, PrimaryGeneratedColumn } from "typeorm";


export class Todo {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column()
    description: string;
}
