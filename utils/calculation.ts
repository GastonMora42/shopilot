export const calculateSeatPrice = (
    seatId: string,
    sections: Array<{ 
      rowStart: number; 
      rowEnd: number; 
      price: number;
      name: string;
    }>
  ): number => {
    const [rowNum] = seatId.split('-');
    const rowNumber = parseInt(rowNum, 10);
    
    const section = sections.find(section => 
      rowNumber >= section.rowStart && rowNumber <= section.rowEnd
    );
  
    return section?.price || 0;
  };